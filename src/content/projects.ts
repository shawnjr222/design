export type Project = {
  id: number
  title: string
  role: string
  years: string
  description: string
  url: string
  image: string
  /** Loop video/Lottie media. Defaults to false (play once). */
  loop?: boolean
}

export const projects: Project[] = [
  {
    id: 1,
    title: 'Gradient Sports',
    role: 'Senior Product Designer',
    years: '2025–Present',
    description:
      'Designing consumer and B2B products while establishing design processes that bring best-in-class football analysis to fans, clubs, and media.',
    url: 'https://www.gradientsports.com',
    image: '/assets/gradient-sports.json',
  },
  {
    id: 3,
    title: 'Hinge Health',
    role: 'Senior Product Designer',
    years: '2023–2024',
    description:
      'Led design for enrollment and onboarding, helping members access personalized care for chronic and acute pain.',
    url: 'https://www.hingehealth.com',
    image: '/assets/HingeHealth.mp4',
  },
  {
    id: 4,
    title: 'Coping with Capitalism',
    role: 'Curator',
    years: '2023–2025',
    description:
      'Built a community publication while leading web and branding work that made self and collective care more accessible.',
    url: 'https://www.copingwithcapitalism.com',
    image: '/assets/CopingWithCapitalism.mp4',
    loop: true,
  },
  {
    id: 5,
    title: 'DoorDash',
    role: 'Product Designer',
    years: '2021–2023',
    description:
      'Led 0–1 design for merchant and Dasher products, expanding fulfillment types and driving significant revenue growth.',
    url: 'https://dasher.doordash.com/en-us',
    image: '/assets/DoorDash.mp4',
    loop: true,
  },
  {
    id: 6,
    title: 'Mercury',
    role: 'Product Designer',
    years: '2020–2021',
    description:
      'Drove the product and design roadmap for mobile banking, while raising the craft bar on the core banking experience.',
    url: 'https://mercury.com',
    image: '/assets/mercury.json',
  },
  {
    id: 7,
    title: 'Uber',
    role: 'Product Designer',
    years: '2018–2020',
    description:
      'Shipped accessible, safety-first driver products across 71 countries, from research to launch, while contributing to the design system.',
    url: 'https://www.uber.com/us/en/drive/',
    image: '/assets/Uber.mp4',
  },
]
