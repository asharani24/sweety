import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="container">
      <h1>Hello, {user.name}</h1>
      <button onClick={logout}>Log out</button>
    </div>
  );
}