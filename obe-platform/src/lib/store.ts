'use client';

/**
 * Lightweight global store using React context.
 * Manages dashboard-wide state: active nav, toasts, notifications,
 * and the shared integration state between Syllabus Generator,
 * Mapping Sequencer, and OBE Platform.
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { COObject, POObject, PSOObject, MappingMatrixResponse, SequencerResponse } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────
export type NavPage =
  | 'dashboard'
  | 'programs'
  | 'courses'
  | 'co-po-mapping'
  | 'analytics'
  | 'feedback'
  | 'settings'
  | 'sequencer'
  | 'attainment';


export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export interface AppState {
  // UI state
  activePage: NavPage;
  toasts: Toast[];
  aiPanelOpen: boolean;
  searchOpen: boolean;

  // Integration state: shared across Syllabus Generator → Mapper → OBE
  currentProjectId: number | null;         // Active Mapping Sequencer project ID
  courseOutcomes: Record<string, COObject[]>; // courseCode → generated COs from Syllabus Generator
  programmePos: POObject[];                // Programme Outcomes (PO1–PO12)
  programmePsos: PSOObject[];              // Programme-Specific Outcomes
  mappingMatrix: Record<string, Record<string, number>>; // co_id → { po_id → level }
  mappingExplanations: Record<string, string>;           // "CO1_PO2" → explanation
  sequencerPlan: SequencerResponse | null; // Current semester plan from Sequencer
}

type Action =
  | { type: 'SET_PAGE'; page: NavPage }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'TOGGLE_AI_PANEL' }
  | { type: 'SET_AI_PANEL'; open: boolean }
  | { type: 'SET_SEARCH'; open: boolean }
  // Integration actions
  | { type: 'SET_PROJECT_ID'; id: number | null }
  | { type: 'SET_COURSE_OUTCOMES'; courseCode: string; outcomes: COObject[] }
  | { type: 'SET_PROGRAMME_POS'; pos: POObject[] }
  | { type: 'SET_PROGRAMME_PSOS'; psos: PSOObject[] }
  | { type: 'SET_MAPPING_RESULT'; result: MappingMatrixResponse }
  | { type: 'SET_SEQUENCER_PLAN'; plan: SequencerResponse };

// Default NBA POs for B.Tech programmes
const DEFAULT_POS: POObject[] = [
  { po_id: 'PO1',  title: 'Engineering Knowledge',          text: 'Apply knowledge of mathematics, science, and engineering fundamentals.' },
  { po_id: 'PO2',  title: 'Problem Analysis',               text: 'Identify, formulate, review and analyze complex engineering problems.' },
  { po_id: 'PO3',  title: 'Design/Development of Solutions', text: 'Design solutions for complex engineering problems.' },
  { po_id: 'PO4',  title: 'Investigation of Problems',      text: 'Conduct investigations of complex problems using research methods.' },
  { po_id: 'PO5',  title: 'Modern Tool Usage',              text: 'Apply appropriate techniques and modern engineering tools.' },
  { po_id: 'PO6',  title: 'The Engineer and Society',       text: 'Apply reasoning to assess societal, health, safety, legal and cultural issues.' },
  { po_id: 'PO7',  title: 'Environment and Sustainability', text: 'Understand the impact of professional engineering solutions on environment.' },
  { po_id: 'PO8',  title: 'Ethics',                         text: 'Apply ethical principles and commit to professional ethics.' },
  { po_id: 'PO9',  title: 'Individual and Team Work',       text: 'Function effectively as an individual and as a member or leader in diverse teams.' },
  { po_id: 'PO10', title: 'Communication',                  text: 'Communicate effectively on complex engineering activities.' },
  { po_id: 'PO11', title: 'Project Management and Finance', text: 'Apply knowledge and understanding of the engineering management.' },
  { po_id: 'PO12', title: 'Life-long Learning',             text: 'Recognize the need for and ability to engage in independent and life-long learning.' },
];

const DEFAULT_PSOS: PSOObject[] = [
  { pso_id: 'PSO1', text: 'Apply domain-specific technical skills to solve engineering problems.', domain: 'Technical' },
  { pso_id: 'PSO2', text: 'Use modern software tools and technologies effectively.', domain: 'Tools' },
  { pso_id: 'PSO3', text: 'Demonstrate professional and ethical responsibility in the industry.', domain: 'Professional' },
];

const initialState: AppState = {
  activePage: 'dashboard',
  toasts: [],
  aiPanelOpen: false,
  searchOpen: false,

  currentProjectId: null,
  courseOutcomes: {},
  programmePos: DEFAULT_POS,
  programmePsos: DEFAULT_PSOS,
  mappingMatrix: {},
  mappingExplanations: {},
  sequencerPlan: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, activePage: action.page };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'TOGGLE_AI_PANEL':
      return { ...state, aiPanelOpen: !state.aiPanelOpen };
    case 'SET_AI_PANEL':
      return { ...state, aiPanelOpen: action.open };
    case 'SET_SEARCH':
      return { ...state, searchOpen: action.open };
    // Integration reducers
    case 'SET_PROJECT_ID':
      return { ...state, currentProjectId: action.id };
    case 'SET_COURSE_OUTCOMES':
      return {
        ...state,
        courseOutcomes: { ...state.courseOutcomes, [action.courseCode]: action.outcomes },
      };
    case 'SET_PROGRAMME_POS':
      return { ...state, programmePos: action.pos };
    case 'SET_PROGRAMME_PSOS':
      return { ...state, programmePsos: action.psos };
    case 'SET_MAPPING_RESULT':
      return {
        ...state,
        mappingMatrix: action.result.matrix,
        mappingExplanations: action.result.explanations,
      };
    case 'SET_SEQUENCER_PLAN':
      return { ...state, sequencerPlan: action.plan };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────
interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  setPage: (page: NavPage) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  // Integration helpers
  storeCourseOutcomes: (courseCode: string, outcomes: COObject[]) => void;
  setMappingResult: (result: MappingMatrixResponse) => void;
  setSequencerPlan: (plan: SequencerResponse) => void;
  setCurrentProject: (id: number | null) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setPage = useCallback((page: NavPage) => {
    dispatch({ type: 'SET_PAGE', page });
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: 'ADD_TOAST', toast: { ...toast, id } });
    // Auto-dismiss after 4 seconds
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  const storeCourseOutcomes = useCallback((courseCode: string, outcomes: COObject[]) => {
    dispatch({ type: 'SET_COURSE_OUTCOMES', courseCode, outcomes });
  }, []);

  const setMappingResult = useCallback((result: MappingMatrixResponse) => {
    dispatch({ type: 'SET_MAPPING_RESULT', result });
  }, []);

  const setSequencerPlan = useCallback((plan: SequencerResponse) => {
    dispatch({ type: 'SET_SEQUENCER_PLAN', plan });
  }, []);

  const setCurrentProject = useCallback((id: number | null) => {
    dispatch({ type: 'SET_PROJECT_ID', id });
  }, []);

  return React.createElement(
    StoreContext.Provider,
    {
      value: {
        state, dispatch,
        setPage, addToast, removeToast,
        storeCourseOutcomes, setMappingResult, setSequencerPlan, setCurrentProject,
      },
    },
    children
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
