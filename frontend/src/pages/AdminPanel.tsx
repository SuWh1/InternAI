import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type User = {
  id: string;          // Use string for UUID
  email: string;
  is_admin: boolean;   // Added is_admin
  is_bot: boolean;     // Added is_bot
};

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

type UsersResponse = {
  users: User[];
  pagination: PaginationInfo;
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [bulkNames, setBulkNames] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const token = localStorage.getItem("auth_token");

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/users?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: UsersResponse = res.data;
      setUsers(data.users);
      setPagination(data.pagination);
      setCurrentPage(page);
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
      // Refresh current page after deletion
      await fetchUsers(currentPage);
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const bulkCreateUsers = async () => {
    if (!bulkNames.trim()) {
      setBulkMessage("Please enter at least one name");
      return;
    }

    setBulkLoading(true);
    setBulkMessage("");

    try {
      const names = bulkNames.split(" ").filter(name => name.trim());
      const response = await axios.post("/api/admin/users/bulk-create", 
        { names },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { created_users, errors, total_created, total_errors } = response.data;
      
      setBulkMessage(
        `Created ${total_created} users successfully. ${total_errors > 0 ? `${total_errors} errors occurred.` : ""}`
      );
      
      if (errors.length > 0) {
        console.log("Errors:", errors);
      }

      // Refresh first page to see new users
      await fetchUsers(1);
      setCurrentPage(1);
      setBulkNames("");
    } catch (err: any) {
      setBulkMessage("Failed to create users: " + (err.response?.data?.detail || err.message));
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  if (redirecting || loading || users === null) {
    return null;
  }
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-theme-primary min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-theme-primary">Admin Panel</h1>
      
      {/* Bulk User Creation Section */}
      <div className="mb-8 p-6 border border-theme rounded-xl bg-theme-secondary/50 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 text-theme-primary">Create Multiple Users</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Names (separated by spaces)
            </label>
            <input
              type="text"
              value={bulkNames}
              onChange={(e) => setBulkNames(e.target.value)}
              placeholder="john jane mike sarah"
              className="w-full px-4 py-3 border border-theme rounded-lg bg-theme-primary text-theme-primary placeholder-theme-secondary/50 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent transition-all duration-200"
              disabled={bulkLoading}
            />
            <p className="text-xs text-theme-secondary/70 mt-2">
              Users will be created with emails like: john@gmail.com, jane@gmail.com
            </p>
          </div>
          <button
            onClick={bulkCreateUsers}
            disabled={bulkLoading || !bulkNames.trim()}
            className="px-6 py-3 bg-theme-accent text-white rounded-lg hover:bg-theme-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            {bulkLoading ? "Creating..." : "Create Users"}
          </button>
          {bulkMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              bulkMessage.includes("Failed") 
                ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                : "bg-green-500/10 text-green-500 border border-green-500/20"
            }`}>
              {bulkMessage}
            </div>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-secondary text-lg">No users found.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-theme-secondary font-medium">
              Total users: <span className="text-theme-accent font-semibold">{pagination?.total || 0}</span>
              {pagination && (
                <span className="text-sm ml-2">
                  (Page {pagination.page} of {pagination.total_pages})
                </span>
              )}
            </p>
          </div>
          <div className="grid gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center p-4 border border-theme rounded-xl bg-theme-secondary/30 hover:bg-theme-secondary/50 transition-all duration-200 backdrop-blur-sm"
              >
                <div className="flex-1">
                  <p className="font-semibold text-theme-primary text-lg">{user.email}</p>
                  <p className="text-sm text-theme-secondary mt-1">ID: {user.id}</p>
                  <div className="mt-2 flex space-x-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        user.is_admin
                          ? "bg-theme-accent/20 text-theme-accent border border-theme-accent/30"
                          : "bg-theme-secondary/50 text-theme-secondary border border-theme"
                      }`}
                    >
                      {user.is_admin ? "Admin" : "User"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this user?")) {
                      deleteUser(user.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-500 transition-all duration-200 font-medium shadow-md hover:shadow-lg ml-4"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.has_prev}
                className="px-4 py-2 border border-theme rounded-lg bg-theme-secondary/30 text-theme-primary hover:bg-theme-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                        pageNum === currentPage
                          ? "bg-theme-accent text-white shadow-lg"
                          : "border border-theme bg-theme-secondary/30 text-theme-primary hover:bg-theme-secondary/50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.has_next}
                className="px-4 py-2 border border-theme rounded-lg bg-theme-secondary/30 text-theme-primary hover:bg-theme-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
