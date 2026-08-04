import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {

    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 1.0, green: 0.85, blue: 0.7, alpha: 1.0)

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        // 默认 WKWebsiteDataStore 是 persistent，localStorage 会持久化
        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.scrollView.bounces = false
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.navigationDelegate = self
        view.addSubview(webView)

        // 加载 index.html
        if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
            let baseDir = url.deletingLastPathComponent()
            // 允许读取整个 Resources 目录
            webView.loadFileURL(url, allowingReadAccessTo: Bundle.main.resourceURL ?? baseDir)
        } else {
            let label = UILabel(frame: view.bounds)
            label.textAlignment = .center
            label.text = "未找到 index.html"
            view.addSubview(label)
        }
    }

    // 允许跨源访问本地文件（H5 游戏需要）
    func webView(_ webView: WKWebView,
                decidePolicyFor navigationAction: WKNavigationAction,
                decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(.allow)
    }

    override var prefersStatusBarHidden: Bool { return false }
    override var preferredStatusBarStyle: UIStatusBarStyle { return .default }
}