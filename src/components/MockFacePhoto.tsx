import { View, StyleSheet } from 'react-native';
import Svg, { Ellipse, Path, Circle, G } from 'react-native-svg';

interface MockFacePhotoProps {
  width: number;
  height: number;
  markers?: { type: 'red' | 'black' | 'yellow'; x: number; y: number }[];
}

export default function MockFacePhoto({ width, height, markers }: MockFacePhotoProps) {
  const cx = width / 2;
  const cy = height / 2;
  const faceR = Math.min(width, height) * 0.38;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Ellipse cx={cx} cy={cy} rx={faceR} ry={faceR * 1.25} fill="#F5D0B5" />
        <Ellipse cx={cx} cy={cy} rx={faceR * 0.6} ry={faceR * 1.15} fill="#F0C8A8" opacity={0.4} />
        <Circle cx={cx - faceR * 0.35} cy={cy - faceR * 0.3} r={faceR * 0.08} fill="#2D1B2E" opacity={0.6} />
        <Circle cx={cx + faceR * 0.35} cy={cy - faceR * 0.3} r={faceR * 0.08} fill="#2D1B2E" opacity={0.6} />
        <Path d={`M ${cx - faceR * 0.25} ${cy + faceR * 0.5} Q ${cx} ${cy + faceR * 0.75} ${cx + faceR * 0.25} ${cy + faceR * 0.5}`} fill="none" stroke="#D4956A" strokeWidth={2} strokeLinecap="round" />
        <Path d={`M ${cx - faceR * 0.1} ${cy + faceR * 0.1} Q ${cx} ${cy + faceR * 0.2} ${cx + faceR * 0.1} ${cy + faceR * 0.1}`} fill="none" stroke="#D4956A" strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
      {markers?.map((m, i) => {
        const colorMap = { red: '#E87A7A', black: '#2D1B2E', yellow: '#F4C77A' };
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: m.x - 6,
              top: m.y - 6,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: colorMap[m.type],
              opacity: 0.85,
              borderWidth: 1.5,
              borderColor: '#fff',
            }}
          />
        );
      })}
    </View>
  );
}
