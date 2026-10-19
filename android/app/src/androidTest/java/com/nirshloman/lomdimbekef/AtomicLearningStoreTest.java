package com.nirshloman.lomdimbekef;

import static org.junit.Assert.*;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

@RunWith(AndroidJUnit4.class)
public class AtomicLearningStoreTest {
    private File freshFile() throws Exception {
        File file = File.createTempFile("learning-test-", ".json", InstrumentationRegistry.getInstrumentation().getTargetContext().getNoBackupFilesDir());
        assertTrue(file.delete());
        return file;
    }
    @Test public void checkpointSurvivesReopeningAndLocalDeletion() throws Exception {
        File path = freshFile();
        AtomicLearningStore store = new AtomicLearningStore(path);
        try {
            store.put("first", "round 2"); store.put("second", "round 5");
            store = new AtomicLearningStore(path);
            assertEquals("round 2", store.read().getString("first"));
            store.remove("first");
            assertEquals("round 5", store.read().getString("second"));
            assertFalse(store.read().has("first"));
            store.clear(); assertEquals(0, store.read().length());
        } finally { path.delete(); }
    }
    @Test public void interruptedWriteRecoversLastAtomicBackup() throws Exception {
        File path = freshFile();
        File backup = new File(path + ".bak");
        try {
            AtomicLearningStore store = new AtomicLearningStore(path);
            store.put("checkpoint", "saved");
            assertTrue(path.renameTo(backup));
            try (FileOutputStream output = new FileOutputStream(path)) { output.write("{broken".getBytes(StandardCharsets.UTF_8)); }
            assertEquals("saved", new AtomicLearningStore(path).read().getString("checkpoint"));
        } finally { path.delete(); backup.delete(); }
    }
    @Test public void corruptedFileIsPreservedAndCannotBeOverwrittenByMutation() throws Exception {
        File path = freshFile();
        try {
            try (FileOutputStream output = new FileOutputStream(path)) { output.write("{broken".getBytes(StandardCharsets.UTF_8)); }
            AtomicLearningStore store = new AtomicLearningStore(path);
            try { store.read(); fail("Must reject corruption"); } catch (org.json.JSONException expected) { }
            try { store.put("checkpoint", "new"); fail("Must preserve corruption"); } catch (org.json.JSONException expected) { }
            assertEquals(7, path.length());
        } finally { path.delete(); }
    }
}
