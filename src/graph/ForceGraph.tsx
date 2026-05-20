import { useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

const LEGEND_ITEMS = [
  { color: '#6c63ff', label: '同义词' },
  { color: '#f7971e', label: '上/下位词' },
  { color: '#43e97b', label: '反义词' },
  { color: '#4fc3f7', label: '近义词' },
  { color: '#fa709a', label: '派生词' },
  { color: '#a78bfa', label: '整体/部分' },
];

export const ForceGraph = forwardRef<ForceGraphHandle, Props>(({ onNodeTap, onReady }, ref) => {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const pendingRef = useRef<(GraphData & { mode: 'force' | 'tree' }) | null>(null);
  const [legendVisible, setLegendVisible] = useState(false);

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
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{ html: GRAPH_HTML }}
        onMessage={handleMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        scrollEnabled={false}
      />

      {/* 图例按钮 + 展开面板 */}
      <View style={styles.legendWrap}>
        {legendVisible && (
          <View style={styles.legendPanel}>
            {LEGEND_ITEMS.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={styles.legendBtn}
          onPress={() => setLegendVisible((v) => !v)}
        >
          <Text style={styles.legendBtnText}>{legendVisible ? '×' : '?'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

ForceGraph.displayName = 'ForceGraph';

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#0f0f1a' },
  legendWrap: {
    position: 'absolute', top: 12, right: 12,
    alignItems: 'flex-end',
  },
  legendBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  legendBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  legendPanel: {
    backgroundColor: 'rgba(22,33,62,0.92)',
    borderRadius: 10, padding: 10, gap: 6,
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: '#ddd', fontSize: 12 },
});
