import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../../theme/designTokens';

export type FinancialScope = 'all' | 'joel' | 'kath' | 'shared';

interface UserSelectorProps {
  selected: FinancialScope;
  onSelect: (scope: FinancialScope) => void;
  style?: any;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selected,
  onSelect,
  style,
}) => {
  const options: { id: FinancialScope; label: string; icon: string }[] = [
    { id: 'all', label: 'COMPARTIDO', icon: 'people' },
    { id: 'joel', label: 'JOEL', icon: 'person' },
    { id: 'kath', label: 'KATH', icon: 'sparkles' },
  ];

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'web' ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any) : null,
        style,
      ]}
    >
      {options.map((opt) => {
        const isActive = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.id)}
            style={[
              styles.pill,
              isActive && styles.activePill,
              isActive && opt.id === 'kath' && styles.activePillKath,
              isActive && opt.id === 'joel' && styles.activePillJoel,
            ]}
          >
            <Ionicons
              name={opt.icon as any}
              size={14}
              color={isActive ? Colors.ivoryWhite : 'rgba(248, 245, 236, 0.65)'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.label,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignSelf: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
  },
  activePill: {
    backgroundColor: Colors.primaryGreen,
    shadowColor: Colors.secondaryGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  activePillJoel: {
    backgroundColor: Colors.secondaryGreen,
  },
  activePillKath: {
    backgroundColor: Colors.primaryGreen,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  activeLabel: {
    color: Colors.ivoryWhite,
  },
  inactiveLabel: {
    color: 'rgba(248, 245, 236, 0.65)',
  },
});
