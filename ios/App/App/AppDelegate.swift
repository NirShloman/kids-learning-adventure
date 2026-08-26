import UIKit
import Capacitor
import AVFoundation

final class LearningBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(NativeLearningPlugin())
    }
}

@objc(NativeLearningPlugin)
public final class NativeLearningPlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    public let identifier = "NativeLearningPlugin"
    public let jsName = "NativeLearning"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "readAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "narrationAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopSpeaking", returnType: CAPPluginReturnPromise)
    ]

    private let synthesizer = AVSpeechSynthesizer()
    private let fileManager = FileManager.default

    public override func load() {
        synthesizer.delegate = self
    }

    private var storageURL: URL {
        let support = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let directory = support.appendingPathComponent("NoCloud", isDirectory: true)
        try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        var mutableDirectory = directory
        try? mutableDirectory.setResourceValues(values)
        return directory.appendingPathComponent("learner-store.json")
    }

    private func readValues() -> [String: String] {
        guard let data = try? Data(contentsOf: storageURL),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: String] else { return [:] }
        return object
    }

    private func persist(_ values: [String: String]) throws {
        let data = try JSONSerialization.data(withJSONObject: values, options: [.sortedKeys])
        try data.write(to: storageURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }

    @objc public func readAll(_ call: CAPPluginCall) { call.resolve(["values": readValues()]) }

    @objc public func write(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else {
            call.reject("key and value are required"); return
        }
        var values = readValues(); values[key] = value
        do { try persist(values); call.resolve() } catch { call.reject("Could not persist local data", nil, error) }
    }

    @objc public func remove(_ call: CAPPluginCall) {
        var values = readValues()
        if let key = call.getString("key") { values.removeValue(forKey: key) }
        do { try persist(values); call.resolve() } catch { call.reject("Could not remove local data", nil, error) }
    }

    @objc public func clear(_ call: CAPPluginCall) {
        do { try persist([:]); call.resolve() } catch { call.reject("Could not clear local data", nil, error) }
    }

    private var hebrewVoice: AVSpeechSynthesisVoice? {
        AVSpeechSynthesisVoice.speechVoices().first { $0.language.lowercased().hasPrefix("he") }
    }

    @objc public func narrationAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": hebrewVoice != nil])
    }

    @objc public func speak(_ call: CAPPluginCall) {
        guard let voice = hebrewVoice, let text = call.getString("text"), !text.isEmpty else { call.resolve(); return }
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = voice
        utterance.rate = Float(call.getDouble("rate") ?? 0.84) * AVSpeechUtteranceDefaultSpeechRate
        utterance.pitchMultiplier = Float(call.getDouble("pitch") ?? 1.04)
        synthesizer.stopSpeaking(at: .immediate)
        synthesizer.speak(utterance)
        call.resolve()
    }

    @objc public func stopSpeaking(_ call: CAPPluginCall) {
        synthesizer.stopSpeaking(at: .immediate)
        notifyListeners("speechState", data: ["speaking": false])
        call.resolve()
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        notifyListeners("speechState", data: ["speaking": true])
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        notifyListeners("speechState", data: ["speaking": false])
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        notifyListeners("speechState", data: ["speaking": false])
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
