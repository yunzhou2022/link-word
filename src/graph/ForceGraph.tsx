import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { GRAPH_HTML } from './graphHtml';
import type { GraphData, ToWebViewMessage, FromWebViewMessage } from './graphTypes';

export interface ForceGraphHandle {
  loadGraph: (data: GraphData & { mode: 'force' | 'tree' }) => void;
}

interface Props {
  onNodeTap: (word: string) => void;
  onReady?: () => void;
}

export const ForceGraph = forwardRef<ForceGraphHandle, Props>(({ onNodeTap, onReady }, ref) => {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const pendingRef = useRef<(GraphData & { mode: 'force' | 'tree' }) | null>(null);

  const sendToWebView = useCallback((data: GraphData & { mode: 'force' | 'tree' }) => {
    const msg: ToWebViewMessage = { type: 'LOAD_GRAPH', word: '', ...data };
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(msg))} })); true;`
    );
  }, []);

  useImperativeHandle(ref, () => ({
    loadGraph(data) {
      if (isReadyRef.current) {
        sendToWebView(data);
      } else {
        pendingRef.current = data;
      }
    },
  }));

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as FromWebViewMessage;
      if (msg.type === 'NODE_TAP') onNodeTap(msg.word);
      if (msg.type === 'GRAPH_READY') {
        isReadyRef.current = true;
        onReady?.();
        if (pendingRef.current) {
          sendToWebView(pendingRef.current);
          pendingRef.current = null;
        }
      }
    } catch (_) {}
  }, [onNodeTap, onReady, sendToWebView]);

  return (
    <WebView
      ref={webViewRef}
      style={styles.webview}
      source={{ html: GRAPH_HTML }}
      onMessage={handleMessage}
      originWhitelist={['*']}
      javaScriptEnabled
      scrollEnabled={false}
    />
  );
});

ForceGraph.displayName = 'ForceGraph';

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: '#0f0f1a' },
});
