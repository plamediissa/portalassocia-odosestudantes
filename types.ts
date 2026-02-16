
export interface Association {
  id: string;
  registrationCode: string;
  name: string;
  schoolName: string;
  adminPasswordHash: string;
  phone?: string;
  province: string;
  municipality: string;
  neighborhood: string;
  createdAt: number;
  logoData?: string;
  schoolLogoData?: string;
  statuteData?: string;
  contractData?: string;
  responsibilityTermData?: string;
  // Membros da Direção
  president?: string;
  presidentGrade?: string;
  presidentCourse?: string;
  presidentPhoto?: string;
  vicePresident?: string;
  vicePresidentGrade?: string;
  vicePresidentCourse?: string;
  vicePresidentPhoto?: string;
  secretary?: string;
  secretaryGrade?: string;
  secretaryCourse?: string;
  secretaryPhoto?: string;
  treasurer?: string;
  treasurerGrade?: string;
  treasurerCourse?: string;
  treasurerPhoto?: string;
}

export interface DepartmentMember {
  id: string;
  name: string;
  role: string;
  grade: string;
  course?: string;
  photoData?: string;
}

export interface Department {
  id: string;
  associationId: string;
  name: string;
  coordinator: string;
  coordinatorGrade?: string;
  coordinatorCourse?: string;
  coordinatorPhoto?: string;
  deputy: string;
  deputyGrade?: string;
  deputyCourse?: string;
  deputyPhoto?: string;
  members: DepartmentMember[];
}

export interface Event {
  id: string;
  associationId: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  imageData?: string;
}

export interface SecondaryAdmin {
  id: string;
  internalId: string; // Admin 01, 02, etc.
  associationId: string;
  name: string;
  role: string;
  grade: string;
  course?: string;
  passwordHash: string;
  photoData?: string;
}

export interface Complaint {
  id: string;
  associationId: string;
  studentName: string;
  grade: string;
  course?: string;
  message: string;
  createdAt: number;
}

export interface PageView {
  associationId: string;
  timestamp: number;
}

export interface SatisfactionVote {
  associationId: string;
  isSatisfied: boolean;
  timestamp: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  associationId: string | null;
  associationName: string | null;
  adminId: string | null;
  adminName: string | null;
}
