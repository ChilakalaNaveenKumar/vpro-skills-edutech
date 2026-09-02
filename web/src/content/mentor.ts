// Real photograph shipped in public/ - never an initial, illustrated head or
// generated face (build-awwwards-quality-sites avatar rule).

export const MENTOR = {
  name: 'Sambasiva Rao',
  roles: ['Software Architect', 'AI Educator', 'Technology Mentor'],
  bio: 'With 17+ years of experience in software development, cloud technologies, artificial intelligence and enterprise solutions, Sambasiva Rao has trained thousands of students and professionals across India.',
  photo: { webp: '/trainer-sambasiva-rao.webp', fallback: '/trainer-sambasiva-rao.jpeg', alt: 'Sambasiva Rao, AI trainer at VPro Skills' },
  stats: [
    { value: '17+', label: 'Years experience' },
    { value: '5000+', label: 'Students trained' },
    { value: '100+', label: 'Projects guided' },
    { value: '95%', label: 'Success rate' },
  ],
} as const
