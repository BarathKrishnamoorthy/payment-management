import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors } from '../theme/colors';

export interface TourStep {
  title: string;
  description: string;
  targetName: string;
  direction?: 'up' | 'down';
}

interface MobileTourProps {
  visible: boolean;
  steps: TourStep[];
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

export const MobileTour: React.FC<MobileTourProps> = ({ visible, steps, onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep] || steps[0];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setCurrentStep(0);
      onFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onFinish();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Animated Directional Arrow */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrowEmoji}>
            {step.direction === 'up' ? '⬆️' : '⬇️'}
          </Text>
          <Text style={styles.targetLabel}>Target: {step.targetName}</Text>
        </View>

        {/* Floating Instruction Card */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badge}>INTERACTIVE TUTORIAL</Text>
              <Text style={styles.stepCount}>
                Step {currentStep + 1} of {steps.length}
              </Text>
            </View>
            <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.body}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.desc}>{step.description}</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.dotsRow}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentStep ? styles.activeDot : i < currentStep ? styles.doneDot : null,
                ]}
              />
            ))}
          </View>

          {/* Controls: Prev, Skip, Next/Finish */}
          <View style={styles.footer}>
            {!isFirst ? (
              <TouchableOpacity onPress={handlePrev} style={styles.prevBtn}>
                <Text style={styles.prevText}>← Prev</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}

            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip All</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>{isLast ? 'Finish ✓' : 'Next →'}</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  arrowContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowEmoji: {
    fontSize: 34,
  },
  targetLabel: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(124, 58, 237, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  card: {
    width: width - 40,
    backgroundColor: Colors.white,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stepCount: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
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
  body: {
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  activeDot: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  doneDot: {
    backgroundColor: '#C084FC',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAF5FF',
  },
  prevBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  prevText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  nextText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});

