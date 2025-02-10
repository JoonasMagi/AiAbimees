declare namespace Express {
    interface Request {
        session: {
            user?: {
                id: number;
                username: string;
            };
            csrfSecret?: string;
            destroy: (callback: (err?: any) => void) => void;
        };
        files?: {
            photo?: {
                name: string;
                mimetype: string;
                mv: (path: string) => Promise<void>;
            };
        };
        csrfToken: () => string;
        body: {
            _csrf?: string;
            username?: string;
            password?: string;
            plant_cultivar?: string;
            plant_species?: string;
            planting_time?: string;
            est_cropping?: number;
        };
    }
}

interface UserPlant {
    user_plant_id: number;
    user_id: number;
    plant_id: number;
    planting_time: string;
    est_cropping: number | null;
    photo_url: string | null;
    is_deleted: number;
}

interface Plant {
    plant_id: number;
    plant_cultivar: string;
    plant_species: string;
    is_deleted: number;
}

interface User {
    user_id: number;
    username: string;
    password: string;
}