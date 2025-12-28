import React from "react";
import { View, Text, Pressable, ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Animated Button with press effect
interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  icon,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const sizeClasses = {
    sm: "py-2 px-4",
    md: "py-4 px-6",
    lg: "py-5 px-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const variantClasses = {
    primary: "bg-primary-500",
    secondary: "bg-accent-purple",
    outline: "border-2 border-primary-500 bg-transparent",
    ghost: "bg-transparent",
  };

  const textVariantClasses = {
    primary: "text-dark-950 font-bold",
    secondary: "text-white font-bold",
    outline: "text-primary-500 font-semibold",
    ghost: "text-white font-semibold",
  };

  if (variant === "primary") {
    const paddingStyles = {
      sm: { paddingVertical: 8, paddingHorizontal: 16 },
      md: { paddingVertical: 16, paddingHorizontal: 24 },
      lg: { paddingVertical: 20, paddingHorizontal: 32 },
    };

    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={animatedStyle}
        className={className}
      >
        <LinearGradient
          colors={["#1DB954", "#1ed760"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            {
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            },
            paddingStyles[size],
          ]}
        >
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            style={{
              color: "#0a0a0a",
              fontWeight: "700",
              fontSize: size === "lg" ? 18 : size === "md" ? 16 : 14,
            }}
          >
            {loading ? "Loading..." : title}
          </Text>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={animatedStyle}
      className={`rounded-2xl ${sizeClasses[size]} ${variantClasses[variant]} flex-row items-center justify-center ${className}`}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text
        className={`${textSizeClasses[size]} ${textVariantClasses[variant]}`}
      >
        {loading ? "Loading..." : title}
      </Text>
    </AnimatedPressable>
  );
};

// Glassmorphism Card
interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "dark";
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  intensity = "medium",
  ...props
}) => {
  const intensityClasses = {
    light: "bg-white/5",
    medium: "bg-white/10",
    dark: "bg-white/20",
  };

  return (
    <View
      className={`${intensityClasses[intensity]} rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};

// Floating Action Card with animation
interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  children,
  className = "",
  delay = 0,
}) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 400 });
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className={className}>
      {children}
    </Animated.View>
  );
};

// Animated Input
interface AnimatedInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  icon?: React.ReactNode;
  className?: string;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  icon,
  className = "",
}) => {
  const borderColor = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor:
      interpolate(borderColor.value, [0, 1], [0, 1]) > 0.5
        ? "#1DB954"
        : "rgba(255,255,255,0.1)",
    transform: [{ scale: scale.value }],
  }));

  const handleFocus = () => {
    borderColor.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1.02, { damping: 15 });
  };

  const handleBlur = () => {
    borderColor.value = withTiming(0, { duration: 200 });
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      style={animatedStyle}
      className={`bg-white/5 rounded-2xl border-2 flex-row items-center px-4 ${className}`}
    >
      {icon && <View className="mr-3">{icon}</View>}
      <Animated.View className="flex-1">
        <View className="py-4">
          <Text
            className="text-white text-base"
            // @ts-ignore - Using native TextInput behavior
            numberOfLines={1}
          >
            {/* Using a View wrapper to apply NativeWind styles */}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Pulse Animation Component
interface PulseViewProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  className = "",
  duration = 2000,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    const animate = () => {
      scale.value = withTiming(1.1, { duration: duration / 2 }, () => {
        scale.value = withTiming(1, { duration: duration / 2 });
      });
      opacity.value = withTiming(1, { duration: duration / 2 }, () => {
        opacity.value = withTiming(0.5, { duration: duration / 2 });
      });
    };

    animate();
    const interval = setInterval(animate, duration);
    return () => clearInterval(interval);
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className={className}>
      {children}
    </Animated.View>
  );
};

// Gradient Text (simulated with View)
interface GradientBadgeProps {
  text: string;
  colors?: string[];
  className?: string;
}

export const GradientBadge: React.FC<GradientBadgeProps> = ({
  text,
  colors = ["#1DB954", "#1ed760"],
  className = "",
}) => {
  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className={`px-4 py-2 rounded-full ${className}`}
    >
      <Text className="text-dark-950 font-bold text-sm">{text}</Text>
    </LinearGradient>
  );
};

// Animated List Item
interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  className = "",
}) => {
  const translateX = useSharedValue(-50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });
    }, index * 100);

    return () => clearTimeout(timeout);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className={className}>
      {children}
    </Animated.View>
  );
};

// Shimmer Loading Placeholder
interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  className = "",
}) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    const animate = () => {
      opacity.value = withTiming(0.7, { duration: 800 }, () => {
        opacity.value = withTiming(0.3, { duration: 800 });
      });
    };

    animate();
    const interval = setInterval(animate, 1600);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: width as number | `${number}%`,
          height,
          borderRadius,
          backgroundColor: "#ffffff20",
        },
      ]}
      className={className}
    />
  );
};
