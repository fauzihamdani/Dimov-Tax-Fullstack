import { TeamMember } from "./team-member";

export type ProjectStatus = "active" | "on hold" | "completed";

export interface Project{
    id: string;
    name: string;
    status: ProjectStatus;
    deadline: string;
    assigned_to : string;
    budget: number;
    created_at:string;
    team_members?: TeamMember; 
    is_deleted: boolean;
}