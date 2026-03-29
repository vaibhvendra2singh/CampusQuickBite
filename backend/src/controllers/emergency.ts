
import { supabase } from '../config/supabase';

export const emergencyRevert = async (req: any, res: any) => {
    const { data, error } = await supabase
        .from('users')
        .update({ role: 'student' })
        .eq('id', '26559b14-0c34-4939-81af-7a1385c67d38');
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Corrected! You are now a student again in the database.' });
};
