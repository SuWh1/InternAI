import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type User = {
  id: string;          // Use string for UUID
  email: string;
  is_admin: boolean;   // Added is_admin
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const token = localStorage.getItem("auth_token");

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setRedirecting(true);
        navigate("/");
        return;
      } else {
        setError("Failed to fetch users");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (redirecting || loading || users === null) {
    return null;
  }
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <>
          <p className="text-gray-600 mb-2">Number of users: {users.length}</p>
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex justify-between items-center border-b py-2"
              >
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-gray-500">ID: {user.id}</p>
                  <p
                    className={
                      user.is_admin
                        ? "text-green-600 font-semibold"
                        : "text-gray-500"
                    }
                  >
                    {user.is_admin ? "Admin" : "User"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this user?")) {
                      deleteUser(user.id);
                    }
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
