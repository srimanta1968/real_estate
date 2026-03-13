import { DataService } from './data.service';

interface ProjectionRecord {
  id: string;
  property_id: number | null;
  year: number | null;
  rental_income: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateProjectionInput {
  property_id?: string;
  year: number;
  rental_income: number;
}

interface UpdateProjectionInput {
  year?: number;
  rental_income?: number;
}

export const ProjectionService = {
  async create(input: CreateProjectionInput): Promise<ProjectionRecord> {
    try {
      const data: Record<string, any> = {
        year: input.year,
        rental_income: input.rental_income,
      };
      if (input.property_id) data.property_id = input.property_id;
      return await DataService.insertOne<ProjectionRecord>('annual_projections', data);
    } catch (error) {
      console.error('ProjectionService create error:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<ProjectionRecord | null> {
    try {
      return await DataService.findOne<ProjectionRecord>(
        'SELECT * FROM annual_projections WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('ProjectionService findById error:', error);
      throw error;
    }
  },

  async findByPropertyId(propertyId: string): Promise<ProjectionRecord[]> {
    try {
      return await DataService.findMany<ProjectionRecord>(
        'SELECT * FROM annual_projections WHERE property_id = $1 ORDER BY year ASC',
        [propertyId]
      );
    } catch (error) {
      console.error('ProjectionService findByPropertyId error:', error);
      throw error;
    }
  },

  async update(id: string, input: UpdateProjectionInput): Promise<ProjectionRecord | null> {
    try {
      const data: Record<string, any> = {};
      if (input.year !== undefined) data.year = input.year;
      if (input.rental_income !== undefined) data.rental_income = input.rental_income;

      if (Object.keys(data).length === 0) {
        return await this.findById(id);
      }

      const results = await DataService.update<ProjectionRecord>('annual_projections', data, 'id = $1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('ProjectionService update error:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const count = await DataService.delete('annual_projections', 'id = $1', [id]);
      return count > 0;
    } catch (error) {
      console.error('ProjectionService delete error:', error);
      throw error;
    }
  },
};

export default ProjectionService;
