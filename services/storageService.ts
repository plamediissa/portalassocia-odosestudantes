
import { Association, Department, Event, SecondaryAdmin, Complaint, PageView, SatisfactionVote } from '../types';

const STORAGE_KEY_ASSOCIATIONS = 'ae_manager_associations';
const STORAGE_KEY_DEPARTMENTS = 'ae_manager_departments';
const STORAGE_KEY_EVENTS = 'ae_manager_events';
const STORAGE_KEY_ADMINS = 'ae_manager_secondary_admins';
const STORAGE_KEY_COMPLAINTS = 'ae_manager_complaints';
const STORAGE_KEY_VIEWS = 'ae_manager_views';
const STORAGE_KEY_SATISFACTION = 'ae_manager_satisfaction';

const getData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storageService = {
  // --- Utilitários de Segurança ---
  hashPassword: async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // --- Associações ---
  getTotalAssociationsCount: async (): Promise<number> => {
    return getData<Association>(STORAGE_KEY_ASSOCIATIONS).length;
  },

  createAssociation: async (schoolName: string, associationName: string, phone: string, location: { province: string, municipality: string, neighborhood: string }): Promise<{ association: Association, plainPassword: string }> => {
    const associations = getData<Association>(STORAGE_KEY_ASSOCIATIONS);
    
    let registrationCode = '';
    let isUnique = false;
    while (!isUnique) {
      const num = Math.floor(1000 + Math.random() * 9000);
      registrationCode = `AE-${num}`;
      isUnique = !associations.some(a => a.registrationCode === registrationCode);
    }

    const plainPassword = Math.random().toString(36).slice(-10).toUpperCase();

    const newAssoc: Association = {
      id: Math.random().toString(36).substr(2, 9),
      registrationCode,
      schoolName,
      name: associationName,
      phone,
      province: location.province,
      municipality: location.municipality,
      neighborhood: location.neighborhood,
      adminPasswordHash: plainPassword,
      createdAt: Date.now()
    };

    associations.push(newAssoc);
    setData(STORAGE_KEY_ASSOCIATIONS, associations);
    return { association: newAssoc, plainPassword };
  },

  findAssociationById: async (id: string): Promise<Association | undefined> => {
    return getData<Association>(STORAGE_KEY_ASSOCIATIONS).find(a => a.id === id);
  },

  findAssociationByCode: async (code: string): Promise<Association | undefined> => {
    return getData<Association>(STORAGE_KEY_ASSOCIATIONS).find(a => a.registrationCode.toUpperCase() === code.toUpperCase());
  },

  findAssociationByName: async (name: string): Promise<Association | undefined> => {
    const associations = getData<Association>(STORAGE_KEY_ASSOCIATIONS);
    const searchLower = name.toLowerCase();
    return associations.find(a => 
      a.name.toLowerCase().includes(searchLower) || 
      a.schoolName.toLowerCase().includes(searchLower)
    );
  },

  updateAssociation: async (id: string, updates: Partial<Association>): Promise<void> => {
    const associations = getData<Association>(STORAGE_KEY_ASSOCIATIONS);
    const index = associations.findIndex(a => a.id === id);
    if (index !== -1) {
      associations[index] = { ...associations[index], ...updates };
      setData(STORAGE_KEY_ASSOCIATIONS, associations);
    }
  },

  // --- Administradores Secundários ---
  getAllSecondaryAdmins: async (): Promise<SecondaryAdmin[]> => {
    return getData<SecondaryAdmin>(STORAGE_KEY_ADMINS);
  },

  getAdminsByAssociation: async (associationId: string): Promise<SecondaryAdmin[]> => {
    return getData<SecondaryAdmin>(STORAGE_KEY_ADMINS).filter(a => a.associationId === associationId);
  },

  addAdmin: async (admin: Omit<SecondaryAdmin, 'id'>): Promise<SecondaryAdmin> => {
    const admins = getData<SecondaryAdmin>(STORAGE_KEY_ADMINS);
    const newAdmin: SecondaryAdmin = { ...admin, id: Math.random().toString(36).substr(2, 9) };
    admins.push(newAdmin);
    setData(STORAGE_KEY_ADMINS, admins);
    return newAdmin;
  },

  updateAdmin: async (id: string, updates: Partial<SecondaryAdmin>): Promise<void> => {
    const admins = getData<SecondaryAdmin>(STORAGE_KEY_ADMINS);
    const index = admins.findIndex(a => a.id === id);
    if (index !== -1) {
      admins[index] = { ...admins[index], ...updates };
      setData(STORAGE_KEY_ADMINS, admins);
    }
  },

  deleteAdmin: async (id: string): Promise<void> => {
    setData(STORAGE_KEY_ADMINS, getData<SecondaryAdmin>(STORAGE_KEY_ADMINS).filter(a => a.id !== id));
  },

  // --- Departamentos ---
  getDepartmentsByAssociation: async (associationId: string): Promise<Department[]> => {
    return getData<Department>(STORAGE_KEY_DEPARTMENTS).filter(d => d.associationId === associationId);
  },

  addDepartment: async (dept: Omit<Department, 'id'>): Promise<Department> => {
    const departments = getData<Department>(STORAGE_KEY_DEPARTMENTS);
    const newDept: Department = { ...dept, id: Math.random().toString(36).substr(2, 9) };
    departments.push(newDept);
    setData(STORAGE_KEY_DEPARTMENTS, departments);
    return newDept;
  },

  updateDepartment: async (id: string, updates: Partial<Department>): Promise<void> => {
    const departments = getData<Department>(STORAGE_KEY_DEPARTMENTS);
    const index = departments.findIndex(d => d.id === id);
    if (index !== -1) {
      departments[index] = { ...departments[index], ...updates };
      setData(STORAGE_KEY_DEPARTMENTS, departments);
    }
  },

  deleteDepartment: async (id: string): Promise<void> => {
    setData(STORAGE_KEY_DEPARTMENTS, getData<Department>(STORAGE_KEY_DEPARTMENTS).filter(d => d.id !== id));
  },

  // --- Eventos ---
  getEventsByAssociation: async (associationId: string): Promise<Event[]> => {
    return getData<Event>(STORAGE_KEY_EVENTS).filter(e => e.associationId === associationId);
  },

  addEvent: async (event: Omit<Event, 'id'>): Promise<Event> => {
    const events = getData<Event>(STORAGE_KEY_EVENTS);
    const newEvent: Event = { ...event, id: Math.random().toString(36).substr(2, 9) };
    events.push(newEvent);
    setData(STORAGE_KEY_EVENTS, events);
    return newEvent;
  },

  updateEvent: async (id: string, updates: Partial<Event>): Promise<void> => {
    const events = getData<Event>(STORAGE_KEY_EVENTS);
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      setData(STORAGE_KEY_EVENTS, events);
    }
  },

  deleteEvent: async (id: string): Promise<void> => {
    setData(STORAGE_KEY_EVENTS, getData<Event>(STORAGE_KEY_EVENTS).filter(e => e.id !== id));
  },

  // --- Reclamações ---
  getComplaintsByAssociation: async (associationId: string): Promise<Complaint[]> => {
    return getData<Complaint>(STORAGE_KEY_COMPLAINTS)
      .filter(c => c.associationId === associationId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  addComplaint: async (complaint: Omit<Complaint, 'id' | 'createdAt'>): Promise<Complaint> => {
    const complaints = getData<Complaint>(STORAGE_KEY_COMPLAINTS);
    const newComplaint: Complaint = { 
      ...complaint, 
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    complaints.push(newComplaint);
    setData(STORAGE_KEY_COMPLAINTS, complaints);
    return newComplaint;
  },

  deleteComplaint: async (id: string): Promise<void> => {
    setData(STORAGE_KEY_COMPLAINTS, getData<Complaint>(STORAGE_KEY_COMPLAINTS).filter(c => c.id !== id));
  },

  // --- Analytics ---
  recordView: async (associationId: string): Promise<void> => {
    const views = getData<PageView>(STORAGE_KEY_VIEWS);
    views.push({ associationId, timestamp: Date.now() });
    setData(STORAGE_KEY_VIEWS, views);
  },

  getViewStats: async (associationId: string) => {
    const views = getData<PageView>(STORAGE_KEY_VIEWS).filter(v => v.associationId === associationId);
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    
    return {
      today: views.filter(v => now - v.timestamp < msInDay).length,
      week: views.filter(v => now - v.timestamp < msInDay * 7).length,
      month: views.filter(v => now - v.timestamp < msInDay * 30).length,
      year: views.filter(v => now - v.timestamp < msInDay * 365).length
    };
  },

  recordSatisfaction: async (associationId: string, isSatisfied: boolean): Promise<void> => {
    const votes = getData<SatisfactionVote>(STORAGE_KEY_SATISFACTION);
    votes.push({ associationId, isSatisfied, timestamp: Date.now() });
    setData(STORAGE_KEY_SATISFACTION, votes);
  },

  getSatisfactionStats: async (associationId: string) => {
    const votes = getData<SatisfactionVote>(STORAGE_KEY_SATISFACTION).filter(v => v.associationId === associationId);
    const positive = votes.filter(v => v.isSatisfied).length;
    const total = votes.length;
    return {
      positive,
      negative: total - positive,
      total,
      percentage: total > 0 ? Math.round((positive / total) * 100) : 0
    };
  }
};
