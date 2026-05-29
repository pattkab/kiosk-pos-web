/**
 * Runs before React hydration so native shell styles/detection work immediately in the WebView.
 */
export function NativeShellBootstrap() {
  const script = `
(function () {
  var ua = navigator.userAgent || "";
  if (ua.indexOf("KioskPOS-Native/") !== -1) {
    document.documentElement.classList.add("native-app");
  }
})();
`;

  return (
    <script
      id="native-shell-bootstrap"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
