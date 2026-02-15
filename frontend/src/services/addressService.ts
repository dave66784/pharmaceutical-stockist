import api from './api';
import { Address } from '../types';

export const addressService = {
    getAddresses: async () => {
        return api.get<Address[]>('/addresses');
    },

    addAddress: async (address: Omit<Address, 'id'>) => {
        return api.post<Address>('/addresses', address);
    },

    updateAddress: async (id: number, address: Partial<Address>) => {
        return api.put<Address>(`/addresses/${id}`, address);
    },

    deleteAddress: async (id: number) => {
        return api.delete(`/addresses/${id}`);
    }
};
