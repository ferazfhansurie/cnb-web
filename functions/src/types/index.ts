export interface UserData {
  name?: string;
  role: string;
  email: string;
  createdAt?: FirebaseFirestore.Timestamp;
}
