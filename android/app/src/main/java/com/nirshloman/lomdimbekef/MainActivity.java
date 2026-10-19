package com.nirshloman.lomdimbekef;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.File;
import java.util.Iterator;
import java.util.UUID;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeLearningPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @CapacitorPlugin(name = "NativeLearning")
    public static class NativeLearningPlugin extends Plugin {
        private AtomicLearningStore storage;
        private TextToSpeech tts;
        private volatile boolean ttsReady = false;
        private Voice hebrewVoice;

        @Override
        public void load() {
            storage = new AtomicLearningStore(new File(getContext().getNoBackupFilesDir(), "learner-store.json"));
            tts = new TextToSpeech(getContext(), status -> {
                if (status != TextToSpeech.SUCCESS) return;
                ttsReady = true;
                hebrewVoice = tts.getVoices() == null ? null : tts.getVoices().stream()
                    .filter(voice -> "he".equals(voice.getLocale().getLanguage()))
                    .filter(voice -> !voice.isNetworkConnectionRequired())
                    .findFirst().orElse(null);
                if (hebrewVoice != null) tts.setVoice(hebrewVoice);
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String utteranceId) { emitSpeechState(true, utteranceId, false); }
                    @Override public void onDone(String utteranceId) { emitSpeechState(false, utteranceId, false); }
                    @Override public void onError(String utteranceId) { emitSpeechState(false, utteranceId, true); }
                });
            });
        }

        private void emitSpeechState(boolean speaking, String requestId, boolean error) {
            JSObject event = new JSObject();
            event.put("speaking", speaking);
            event.put("requestId", requestId);
            event.put("error", error);
            notifyListeners("speechState", event);
        }

        @PluginMethod
        public void readAll(PluginCall call) {
            try {
                JSONObject source = storage.read();
                JSObject values = new JSObject();
                Iterator<String> keys = source.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    values.put(key, source.optString(key));
                }
                JSObject result = new JSObject();
                result.put("values", values);
                call.resolve(result);
            } catch (Exception error) { call.reject("Could not read local data; existing file preserved", error); }
        }

        @PluginMethod
        public void write(PluginCall call) {
            String key = call.getString("key");
            String value = call.getString("value");
            if (key == null || value == null) { call.reject("key and value are required"); return; }
            try {
                storage.put(key, value);
                call.resolve();
            } catch (Exception error) { call.reject("Could not persist local data", error); }
        }

        @PluginMethod
        public void remove(PluginCall call) {
            String key = call.getString("key");
            try {
                if (key == null) { call.reject("key is required"); return; }
                storage.remove(key);
                call.resolve();
            } catch (Exception error) { call.reject("Could not remove local data", error); }
        }

        @PluginMethod
        public void clear(PluginCall call) {
            try { storage.clear(); call.resolve(); }
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
            if (!ttsReady || hebrewVoice == null || text.isEmpty()) { call.reject("Speech unavailable"); return; }
            tts.setSpeechRate(call.getFloat("rate", 0.84f));
            tts.setPitch(call.getFloat("pitch", 1.04f));
            String requestId = call.getString("requestId", UUID.randomUUID().toString());
            Bundle params = new Bundle();
            params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, Math.max(0f, Math.min(1f, call.getFloat("volume", 0.8f))));
            if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, requestId) == TextToSpeech.ERROR) {
                call.reject("Speech failed"); return;
            }
            call.resolve();
        }

        @PluginMethod
        public void stopSpeaking(PluginCall call) {
            if (tts != null) tts.stop();
            emitSpeechState(false, "", false);
            call.resolve();
        }

        @Override
        protected void handleOnDestroy() {
            if (tts != null) tts.shutdown();
        }
    }
}
