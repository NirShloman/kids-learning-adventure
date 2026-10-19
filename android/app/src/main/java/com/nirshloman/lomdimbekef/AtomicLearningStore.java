package com.nirshloman.lomdimbekef;

import android.util.AtomicFile;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/** Private on-device storage. Reads recover interrupted writes and fail closed on corruption. */
final class AtomicLearningStore {
    private final AtomicFile file;
    AtomicLearningStore(File path) { file = new AtomicFile(path); }

    synchronized JSONObject read() throws Exception {
        try (FileInputStream input = file.openRead()) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int length;
            while ((length = input.read(buffer)) != -1) bytes.write(buffer, 0, length);
            return new JSONObject(bytes.toString(StandardCharsets.UTF_8.name()));
        } catch (FileNotFoundException error) {
            if (!file.getBaseFile().exists() && !new File(file.getBaseFile() + ".bak").exists()) return new JSONObject();
            throw error;
        }
    }

    synchronized void put(String key, String value) throws Exception {
        JSONObject object = read();
        object.put(key, value);
        write(object);
    }

    synchronized void remove(String key) throws Exception {
        JSONObject object = read();
        object.remove(key);
        write(object);
    }

    synchronized void clear() throws Exception { write(new JSONObject()); }

    private void write(JSONObject object) throws Exception {
        FileOutputStream output = null;
        try {
            output = file.startWrite();
            output.write(object.toString().getBytes(StandardCharsets.UTF_8));
            file.finishWrite(output);
        } catch (Exception error) {
            if (output != null) file.failWrite(output);
            throw error;
        }
    }
}
