// Mock data for the OBE Platform Dashboard

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  status: 'approved' | 'draft' | 'review' | 'published';
  progress: number;
  department: string;
  faculty: string;
  cosCount: number;
  posCount: number;
}

export interface Activity {
  id: string;
  type: 'approved' | 'generated' | 'pending' | 'created' | 'mapped';
  entityName: string;
  entityCode: string;
  description: string;
  timestamp: string;
  user?: string;
}

export interface BloomsData {
  name: string;
  value: number;
  color: string;
  count: number;
}

export interface COPOCell {
  row: string;
  col: string;
  value: number;
}

export interface Notification {
  id: string;
  type: 'review' | 'ai' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const currentUser = {
  name: 'Dr. Rajesh Kumar',
  email: 'rajesh.kumar@university.edu',
  role: 'Faculty - CSE Department',
  avatar: '/avatar.png',
  initials: 'RK',
};

export const courses: Course[] = [
  {
    id: '1',
    code: 'CS201',
    name: 'Data Structures',
    semester: 3,
    credits: 4,
    status: 'approved',
    progress: 92,
    department: 'CSE',
    faculty: 'Dr. Rajesh Kumar',
    cosCount: 6,
    posCount: 4,
  },
  {
    id: '2',
    code: 'CS301',
    name: 'Operating Systems',
    semester: 5,
    credits: 4,
    status: 'review',
    progress: 68,
    department: 'CSE',
    faculty: 'Dr. Rajesh Kumar',
    cosCount: 5,
    posCount: 3,
  },
  {
    id: '3',
    code: 'CS302',
    name: 'Database Management Systems',
    semester: 5,
    credits: 4,
    status: 'review',
    progress: 45,
    department: 'CSE',
    faculty: 'Dr. Rajesh Kumar',
    cosCount: 4,
    posCount: 5,
  },
  {
    id: '4',
    code: 'CS401',
    name: 'Machine Learning',
    semester: 7,
    credits: 3,
    status: 'draft',
    progress: 30,
    department: 'CSE',
    faculty: 'Dr. Rajesh Kumar',
    cosCount: 5,
    posCount: 6,
  },
  {
    id: '5',
    code: 'CS202',
    name: 'Web Development',
    semester: 4,
    credits: 3,
    status: 'approved',
    progress: 100,
    department: 'CSE',
    faculty: 'Dr. Rajesh Kumar',
    cosCount: 6,
    posCount: 4,
  },
  {
    id: '6',
    code: 'CS303',
    name: 'Computer Networks',
    semester: 5,
    credits: 4,
    status: 'published',
    progress: 85,
    department: 'CSE',
    faculty: 'Dr. Rajesh Kumar',
    cosCount: 5,
    posCount: 5,
  },
];

export const activities: Activity[] = [
  {
    id: '1',
    type: 'approved',
    entityName: 'Data Structures',
    entityCode: 'CS201',
    description: 'approved by Dr. Sharma',
    timestamp: '2 hours ago',
    user: 'Dr. Sharma',
  },
  {
    id: '2',
    type: 'generated',
    entityName: 'Operating Systems',
    entityCode: 'CS301',
    description: '4 COs generated using AI',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    type: 'pending',
    entityName: 'Database Management',
    entityCode: 'CS302',
    description: 'Pending your review',
    timestamp: '1 day ago',
  },
  {
    id: '4',
    type: 'created',
    entityName: 'Web Development',
    entityCode: 'CS202',
    description: 'course created',
    timestamp: '2 days ago',
  },
  {
    id: '5',
    type: 'mapped',
    entityName: 'Machine Learning',
    entityCode: 'CS401',
    description: 'mapped to 6 POs',
    timestamp: '3 days ago',
  },
];

export const bloomsData: BloomsData[] = [
  { name: 'Remember', value: 15, color: '#93C5FD', count: 23 },
  { name: 'Understand', value: 20, color: '#3B82F6', count: 31 },
  { name: 'Apply', value: 25, color: '#8B5CF6', count: 39 },
  { name: 'Analyze', value: 20, color: '#F97316', count: 31 },
  { name: 'Evaluate', value: 12, color: '#EF4444', count: 19 },
  { name: 'Create', value: 8, color: '#10B981', count: 13 },
];

export const copoMatrix: COPOCell[] = [
  // CO1 mappings
  { row: 'CO1', col: 'PO1', value: 3 },
  { row: 'CO1', col: 'PO2', value: 2 },
  { row: 'CO1', col: 'PO3', value: 1 },
  { row: 'CO1', col: 'PO4', value: 0 },
  { row: 'CO1', col: 'PO5', value: 2 },
  // CO2 mappings
  { row: 'CO2', col: 'PO1', value: 2 },
  { row: 'CO2', col: 'PO2', value: 3 },
  { row: 'CO2', col: 'PO3', value: 2 },
  { row: 'CO2', col: 'PO4', value: 1 },
  { row: 'CO2', col: 'PO5', value: 0 },
  // CO3 mappings
  { row: 'CO3', col: 'PO1', value: 1 },
  { row: 'CO3', col: 'PO2', value: 2 },
  { row: 'CO3', col: 'PO3', value: 3 },
  { row: 'CO3', col: 'PO4', value: 2 },
  { row: 'CO3', col: 'PO5', value: 1 },
  // CO4 mappings
  { row: 'CO4', col: 'PO1', value: 0 },
  { row: 'CO4', col: 'PO2', value: 1 },
  { row: 'CO4', col: 'PO3', value: 2 },
  { row: 'CO4', col: 'PO4', value: 3 },
  { row: 'CO4', col: 'PO5', value: 2 },
  // CO5 mappings
  { row: 'CO5', col: 'PO1', value: 2 },
  { row: 'CO5', col: 'PO2', value: 0 },
  { row: 'CO5', col: 'PO3', value: 1 },
  { row: 'CO5', col: 'PO4', value: 2 },
  { row: 'CO5', col: 'PO5', value: 3 },
];

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'review',
    title: 'Course Review Required',
    description: 'CS302 - Database Management needs your approval',
    timestamp: '10 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'ai',
    title: 'AI Suggestion Available',
    description: 'New COs generated for CS301 - Operating Systems',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'system',
    title: 'System Update',
    description: 'OBE Platform v2.1 is now available with new features',
    timestamp: '3 hours ago',
    read: false,
  },
  {
    id: '4',
    type: 'review',
    title: 'Mapping Completed',
    description: 'CO-PO mapping for CS201 has been verified',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '5',
    type: 'ai',
    title: 'Bloom\'s Analysis Ready',
    description: 'Distribution analysis for Semester 5 is available',
    timestamp: '2 days ago',
    read: true,
  },
];

export const quickPrompts = [
  'Generate COs for Data Mining',
  'Show Semester 5 curriculum',
  'Map COs to POs for CS301',
  'Analyze Bloom\'s distribution',
  'Suggest improvements for CS201',
  'Compare CO coverage across semesters',
];

export const stats = {
  totalCourses: 24,
  pendingReviews: 7,
  aiGenerated: 156,
  completionRate: 78,
};
