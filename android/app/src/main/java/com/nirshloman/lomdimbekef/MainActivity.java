package com.nirshloman.lomdimbekef;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.AtomicFile;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeLearningPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @CapacitorPlugin(name = "NativeLearning")
    public static class NativeLearningPlugin extends Plugin {
        private AtomicFile storage;
        private TextToSpeech tts;
        private volatile boolean ttsReady = false;
        private Voice hebrewVoice;

        @Override
        public void load() {
            storage = new AtomicFile(new File(getContext().getNoBackupFilesDir(), "learner-store.json"));
            tts = new TextToSpeech(getContext(), status -> {
                if (status != TextToSpeech.SUCCESS) return;
                ttsReady = true;
                hebrewVoice = tts.getVoices().stream()
                    .filter(voice -> "he".equals(voice.getLocale().getLanguage()))
                    .filter(voice -> !voice.isNetworkConnectionRequired())
                    .findFirst().orElse(null);
                if (hebrewVoice != null) tts.setVoice(hebrewVoice);
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String utteranceId) { emitSpeechState(true); }
                    @Override public void onDone(String utteranceId) { emitSpeechState(false); }
                    @Override public void onError(String utteranceId) { emitSpeechState(false); }
                });
            });
        }

        private synchronized JSONObject readObject() {
            try {
                if (!storage.getBaseFile().exists()) return new JSONObject();
                return new JSONObject(new String(Files.readAllBytes(storage.getBaseFile().toPath()), StandardCharsets.UTF_8));
            } catch (Exception ignored) {
                return new JSONObject();
            }
        }

        private synchronized void writeObject(JSONObject object) throws Exception {
            FileOutputStream output = null;
            try {
                output = storage.startWrite();
                output.write(object.toString().getBytes(StandardCharsets.UTF_8));
                storage.finishWrite(output);
            } catch (Exception error) {
                if (output != null) storage.failWrite(output);
                throw error;
            }
        }

        private void emitSpeechState(boolean speaking) {
            JSObject event = new JSObject();
            event.put("speaking", speaking);
            notifyListeners("speechState", event);
        }

        @PluginMethod
        public void readAll(PluginCall call) {
            JSONObject source = readObject();
            JSObject values = new JSObject();
            Iterator<String> keys = source.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                values.put(key, source.optString(key));
            }
            JSObject result = new JSObject();
            result.put("values", values);
            call.resolve(result);
        }

        @PluginMethod
        public void write(PluginCall call) {
            String key = call.getString("key");
            String value = call.getString("value");
            if (key == null || value == null) { call.reject("key and value are required"); return; }
            try {
                JSONObject object = readObject();
                object.put(key, value);
                writeObject(object);
                call.resolve();
            } catch (Exception error) { call.reject("Could not persist local data", error); }
        }

        @PluginMethod
        public void remove(PluginCall call) {
            String key = call.getString("key");
            try {
                JSONObject object = readObject();
                if (key != null) object.remove(key);
                writeObject(object);
                call.resolve();
            } catch (Exception error) { call.reject("Could not remove local data", error); }
        }

        @PluginMethod
        public void clear(PluginCall call) {
            try { writeObject(new JSONObject()); call.resolve(); }
            catch (Exception error) { call.reject("Could not clear local data", error); }
        }

        @PluginMethod
        public void narrationAvailable(PluginCall call) {
            JSObject result = new JSObject();
            result.put("available", ttsReady && hebrewVoice != null);
            call.resolve(result);
        }

        @PluginMethod
        public void speak(PluginCall call) {
            String text = call.getString("text", "");
            if (!ttsReady || hebrewVoice == null || text.isEmpty()) { call.resolve(); return; }
            tts.setSpeechRate(call.getFloat("rate", 0.84f));
            tts.setPitch(call.getFloat("pitch", 1.04f));
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, UUID.randomUUID().toString());
            call.resolve();
        }

        @PluginMethod
        public void stopSpeaking(PluginCall call) {
            if (tts != null) tts.stop();
            emitSpeechState(false);
            call.resolve();
        }

        @Override
        protected void handleOnDestroy() {
            if (tts != null) tts.shutdown();
        }
    }
}
