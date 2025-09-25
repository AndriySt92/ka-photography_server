import { SessionType } from "../types";

export interface BookingRequest {
  name: string;
  contact: string;
  sessionType: SessionType;
  comment?: string;
  sessionDate?: string;
}
