export const imageAssets = {
  guideHappy: '/assets/images/characters/guide-happy.png',
  bgLanding: '/assets/images/backgrounds/landing.jpg',
  bgLetters: '/assets/images/backgrounds/letters.jpg',
  bgNumbers: '/assets/images/backgrounds/numbers.jpg',
  bgShapes: '/assets/images/backgrounds/shapes.jpg',
  bgColors: '/assets/images/backgrounds/colors.jpg',
  bgActivities: '/assets/images/backgrounds/activities.jpg',
  bgMatching: '/assets/images/backgrounds/matching.jpg',
  bgMemory: '/assets/images/backgrounds/memory.jpg',
  bgPatterns: '/assets/images/backgrounds/patterns.jpg',
  bgSorting: '/assets/images/backgrounds/sorting.jpg',
  apple: '/assets/images/objects/apple.png',
  appleExperience: '/assets/images/objects/apple-experience.png',
  strawberry: '/assets/images/objects/strawberry.png',
  ball: '/assets/images/objects/ball.png',
  book: '/assets/images/objects/book.png',
  sun: '/assets/images/objects/sun.png',
  flower: '/assets/images/objects/flower.png',
  balloon: '/assets/images/objects/balloon.png',
  car: '/assets/images/objects/car.png',
  starReward: '/assets/images/rewards/star.png',
  medal: '/assets/images/rewards/medal.png',
  trophy: '/assets/images/rewards/trophy.png',
  experienceSprites: '/assets/images/experience-sprites.png',
  characterSprites: '/assets/images/character-sprites-v2.png'
} as const;

export type ImageAssetId = keyof typeof imageAssets;
