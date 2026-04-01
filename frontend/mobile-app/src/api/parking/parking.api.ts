import { apiClient } from '../client';

export interface ParkingSlot {
    id: number;
    slot_number: string;
    type: string;
    flat_number: string;
    status: string;
}

export interface Vehicle {
    id: number;
    vehicle_number: string;
    vehicle_type: string;
    model: string;
    color: string;
}

export const getMySlot = async (): Promise<ParkingSlot | null> => {
    const response = await apiClient.get<ParkingSlot | null>('/parking/slot/mine');
    return response.data;
}

export const getMyVehicles = async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/parking/vehicle/mine');
    return response.data;
}
