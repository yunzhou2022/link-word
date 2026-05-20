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

  useImperativeHandle(ref, () => ({
    loadGraph(data) {
      const msg: ToWebViewMessage = { type: 'LOAD_GRAPH', word: '', ...data };
      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(msg))} })); true;`
      );
    },
  }));

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as FromWebViewMessage;
      if (msg.type === 'NODE_TAP') onNodeTap(msg.word);
      if (msg.type === 'GRAPH_READY') onReady?.();
    } catch (_) {}
  }, [onNodeTap, onReady]);

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
