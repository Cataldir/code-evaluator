export type Repository = {
  id: string;
  challenge_id: string;
  name: string;
  url: string;
  created_at: string;
};

export type RepositoryForm = {
  name: string;
  url: string;
};
