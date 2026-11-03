import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Colors } from '../theme/colors';

interface MobileGuidanceModalProps {
  visible: boolean;
  onClose: () => void;
  moduleTitle: string;
  features: { title: string; desc: string }[];
  instructions: { action: string; steps: string[] }[];
  fields: { name: string; meaning: string }[];
}

const { width } = Dimensions.get('window');

export const MobileGuidanceModal: React.FC<MobileGuidanceModalProps> = ({
  visible,
  onClose,
  moduleTitle,
  features,
  instructions,
  fields,
}) => {
  const [tab, setTab] = useState<'features' | 'steps' | 'fields'>('features');

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerBadge}>USER GUIDANCE & MANUAL</Text>
              <Text style={styles.headerTitle}>{moduleTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setTab('features')}
              style={[styles.tabItem, tab === 'features' && styles.activeTabItem]}
            >
              <Text style={[styles.tabText, tab === 'features' && styles.activeTabText]}>
                Features
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('steps')}
              style={[styles.tabItem, tab === 'steps' && styles.activeTabItem]}
            >
              <Text style={[styles.tabText, tab === 'steps' && styles.activeTabText]}>
                How To
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('fields')}
              style={[styles.tabItem, tab === 'fields' && styles.activeTabItem]}
            >
              <Text style={[styles.tabText, tab === 'fields' && styles.activeTabText]}>
                Fields
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {tab === 'features' && (
              <View style={styles.section}>
                {features.map((item, i) => (
                  <View key={i} style={styles.featureBox}>
                    <Text style={styles.featureTitle}>✨ {item.title}</Text>
                    <Text style={styles.featureDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            )}

            {tab === 'steps' && (
              <View style={styles.section}>
                {instructions.map((inst, i) => (
                  <View key={i} style={styles.instBox}>
                    <Text style={styles.instAction}>👉 {inst.action}</Text>
                    {inst.steps.map((s, si) => (
                      <Text key={si} style={styles.instStep}>
                        {si + 1}. {s}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {tab === 'fields' && (
              <View style={styles.section}>
                {fields.map((f, i) => (
                  <View key={i} style={styles.fieldRow}>
                    <Text style={styles.fieldName}>{f.name}</Text>
                    <Text style={styles.fieldMeaning}>{f.meaning}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.closeActionBtn}>
              <Text style={styles.closeActionText}>Understood, Close Guide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: width - 32,
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadge: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '800',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF5FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  body: {
    padding: 18,
  },
  section: {
    gap: 12,
    paddingBottom: 16,
  },
  featureBox: {
    backgroundColor: '#FAF5FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  instBox: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  instStep: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginLeft: 6,
    marginVertical: 2,
  },
  fieldRow: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  fieldMeaning: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAF5FF',
  },
  closeActionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeActionText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
});

