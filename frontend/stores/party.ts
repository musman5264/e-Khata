import { create } from 'zustand';

interface Party {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  city: string | null;
  type: 'customer' | 'supplier' | 'both';
  khata_number: string | null;
  book_number: string | null;
  opening_balance: number;
  opening_balance_type: 'dr' | 'cr';
  current_balance: number;
  is_active: boolean;
}

interface PartyState {
  parties: Party[];
  selectedParty: Party | null;
  searchQuery: string;
  typeFilter: string | null;
  sortBy: string;
  setParties: (parties: Party[]) => void;
  setSelectedParty: (party: Party | null) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: string | null) => void;
  setSortBy: (sort: string) => void;
}

export const usePartyStore = create<PartyState>((set) => ({
  parties: [],
  selectedParty: null,
  searchQuery: '',
  typeFilter: null,
  sortBy: 'name',
  setParties: (parties) => set({ parties }),
  setSelectedParty: (party) => set({ selectedParty: party }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setSortBy: (sort) => set({ sortBy: sort }),
}));
