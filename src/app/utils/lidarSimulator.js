export function generateLidarData(points = 100) {
  const data = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 360; // Spread points evenly
    const distance = Math.random() * 10; // Random distance up to 10 units
    const radians = (angle * Math.PI) / 180;
    data.push({
      x: Math.cos(radians) * distance,
      y: Math.sin(radians) * distance,
    });
  }
  return data;
} 