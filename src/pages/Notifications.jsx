import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiFilter,
  FiPlus,
  FiTrash2,
  FiSend,
  FiEdit2,
  FiX,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { io } from "socket.io-client"; // 🧩 SOCKET ADDED

export default function Notifications() {
  const [tab, setTab] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  const [filterType, setFilterType] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sending, setSending] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    recipient: "specific",
    userId: "",
    // selectedUsers will be stored separately in stateSelectedUsers
  });

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    title: "",
    message: "",
  });

  const [editingTemplate, setEditingTemplate] = useState(null);

  // ===== Select Users Modal state =====
  const [showSelectUsersModal, setShowSelectUsersModal] = useState(false);
  const [users, setUsers] = useState([]); // accounts list
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]); // array of user _id
  const [selectAll, setSelectAll] = useState(false);
  const [searchUser, setSearchUser] = useState("");

  // 🧩 SOCKET ADDED — kết nối realtime admin (1 lần)
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    try {
      const baseURL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
      const s = io(baseURL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true,
      });
      setSocket(s);

      s.on("connect", () => console.log("🔌 Admin socket connected:", s.id));
      s.on("connect_error", (err) => console.warn("⚠️ Admin socket connect_error:", err.message));
      s.on("disconnect", (reason) => console.warn("⚠️ Admin socket disconnected:", reason));

      return () => {
        if (s && s.disconnect) s.disconnect();
      };
    } catch (err) {
      console.error("❌ Failed to init admin socket:", err);
    }
  }, []);

  // ===== FETCH =====
  useEffect(() => {
    fetchNotifications();
    fetchTemplates();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingList(true);
      const res = await axios.get("http://localhost:5000/notifications/admin/all");
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setNotifications([]);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/notifications/admin/templates");
      setTemplates(res.data || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setTemplates([]);
    }
  };

  // ===== FETCH ACCOUNTS (for Select Users modal) =====
  const fetchAccountsForSelect = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/accounts", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      // Expecting array of accounts
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setUsers(data);
      // If previously selected ids exist, keep them selected (if still present)
      if (selectedUsers.length > 0) {
        const existingSelected = data.filter((u) => selectedUsers.includes(u._id)).map((u) => u._id);
        setSelectedUsers(existingSelected);
        setSelectAll(existingSelected.length === data.length && data.length > 0);
      } else {
        setSelectAll(false);
      }
    } catch (err) {
      console.error("Failed to load accounts:", err);
      setUsers([]);
      setUsersError("Failed to load accounts. Check your token and network.");
      setSelectAll(false);
    } finally {
      setUsersLoading(false);
    }
  };

  // ===== CREATE NOTIFICATION =====
  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message)
      return alert("Please enter both title and message.");

    try {
      setSending(true);
      const payload = {
        title: newNotification.title,
        message: newNotification.message,
        type: "system",
      };

      if (newNotification.recipient === "all") {
        payload.recipientType = "all";
      } else if (newNotification.recipient === "single") {
        payload.recipientType = "specific";
        // for single we accept userId string in userId field
        if (!newNotification.userId || newNotification.userId.trim() === "") {
          alert("Please enter the user ID for single recipient.");
          setSending(false);
          return;
        }
        payload.userId = newNotification.userId.trim();
      } else if (newNotification.recipient === "multiple") {
        payload.recipientType = "multiple";
        payload.userIds = newNotification.userId
          .split(",")
          .map((u) => u.trim())
          .filter((u) => u);
        if (!payload.userIds.length) {
          alert("Please enter at least one user ID for multiple recipients.");
          setSending(false);
          return;
        }
      } else if (newNotification.recipient === "specific") {
  // admin chọn nhiều user => gửi kiểu "multiple"
  payload.recipientType = "multiple";
  payload.userIds = selectedUsers.slice(); // array of _id
  if (!payload.userIds || payload.userIds.length === 0) {
    alert("Please select at least one user.");
    setSending(false);
    return;
  }
}


      const res = await axios.post("http://localhost:5000/notifications/admin/create", payload);
      alert("✅ Notification sent successfully!");
      setShowCreate(false);
      setNewNotification({ title: "", message: "", recipient: "all", userId: "" });
      // reset selections
      setSelectedUsers([]);
      setSelectAll(false);
      fetchNotifications();

      // 🧩 SOCKET EMIT
      try {
        if (socket && socket.connected) {
          socket.emit("adminSentNotification", res.data);
          console.log("📡 adminSentNotification emitted:", res.data);
        } else {
          console.warn("⚠️ Admin socket not connected — cannot emit realtime");
        }
      } catch (emitErr) {
        console.error("❌ Error emitting adminSentNotification:", emitErr);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  // ===== DELETE NOTIFICATION =====
  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await axios.delete(`http://localhost:5000/notifications/admin/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert("Failed to delete notification.");
    }
  };

  // ===== TEMPLATE =====
  const applyTemplateToForm = (template) => {
    setTab("notifications");
    setTimeout(() => {
      setNewNotification({
        title: template.title || "",
        message: template.message || "",
        recipient: "all",
        userId: "",
      });
      setShowCreate(true);
    }, 150);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate({ ...template });
    setShowEditTemplate(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      await axios.patch(
        `http://localhost:5000/notifications/admin/templates/${editingTemplate._id}`,
        {
          title: editingTemplate.title,
          message: editingTemplate.message,
          type: editingTemplate.type || "system",
        }
      );
      alert("✅ Template updated!");
      setShowEditTemplate(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update template.");
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await axios.delete(`http://localhost:5000/notifications/admin/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert("Failed to delete template.");
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.title || !newTemplate.message)
      return alert("Please fill all fields.");
    try {
      setSavingTemplate(true);
      await axios.post("http://localhost:5000/notifications/admin/templates", {
        name: newTemplate.name,
        title: newTemplate.title,
        message: newTemplate.message,
        type: "system",
      });
      alert("✅ Template created successfully!");
      setShowCreateTemplate(false);
      setNewTemplate({ name: "", title: "", message: "" });
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  // ===== Select Users modal helpers =====
  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  useEffect(() => {
    // update selectAll when selectedUsers or users changes
    if (!users || users.length === 0) {
      setSelectAll(false);
      return;
    }
    setSelectAll(selectedUsers.length === users.length && users.length > 0);
  }, [selectedUsers, users]);

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      const allIds = users.map((u) => u._id);
      setSelectedUsers(allIds);
      setSelectAll(true);
    }
  };

  const openSelectUsersModal = () => {
    setShowSelectUsersModal(true);
    // fetch accounts when opening
    fetchAccountsForSelect();
  };

  const closeSelectUsersModal = () => {
    setShowSelectUsersModal(false);
  };

  const confirmSelectUsers = () => {
    // copy selectedUsers into newNotification as well if needed
    // but we keep selectedUsers state as source of truth
    setShowSelectUsersModal(false);
  };

  // ===== FILTER + PAGINATION =====
  const filtered = notifications.filter((n) => {
    const matchType = filterType ? n.type === filterType : true;
    const matchKeyword = searchKeyword
      ? n.title.toLowerCase().includes(searchKeyword.toLowerCase())
      : true;
    return matchType && matchKeyword;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== UI =====
  return (
    <div className="min-h-screen p-2 sm:p-3 lg:p-4 xl:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 mb-4 lg:mb-6 pt-2 lg:pt-3 pb-2 lg:pb-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2 leading-tight flex items-center gap-2">
            <FiBell className="text-indigo-600" /> Notification Management
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-4 shrink-0">
          <div className="bg-gradient-to-r from-yellow-400/20 via-amber-400/20 to-orange-400/20 backdrop-blur-md px-2 lg:px-4 py-1 lg:py-2 rounded-xl border-2 border-yellow-400/50 shadow-md">
            <span className="text-xs lg:text-sm font-semibold text-gray-700">
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-xs lg:text-sm font-semibold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 transform hover:scale-105"
            onClick={() => setShowFilter(!showFilter)}
            aria-label="Toggle filters"
          >
            <FiFilter />
            <span className="font-medium hidden sm:inline">{showFilter ? "Hide Filters" : "Show Filters"}</span>
            <span className="font-medium sm:hidden">Filters</span>
          </button>
          <button
            className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-xs lg:text-sm font-semibold bg-gradient-to-r from-[#E9A319] to-[#A86523] hover:from-[#A86523] hover:to-[#8B4E1A] transform hover:scale-105"
            onClick={() => setShowCreate(true)}
          >
            <FiPlus />
            <span className="font-medium">Create Notification</span>
          </button>
          <button
            className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-4 py-2 lg:py-3 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-xs lg:text-sm font-semibold bg-gradient-to-r from-[#E9A319] to-[#A86523] hover:from-[#A86523] hover:to-[#8B4E1A] transform hover:scale-105"
            onClick={() => setShowCreateTemplate(true)}
          >
            <FiFileText />
            <span className="font-medium">Create Template</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="backdrop-blur-xl rounded-xl border p-3 sm:p-4 lg:p-6 mb-4 lg:mb-6"
            style={{ borderColor: '#A86523', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(251, 191, 36, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }}
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h2 className="text-base lg:text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Search & Filter</h2>
              <button
                onClick={() => {
                  setFilterType("");
                  setSearchKeyword("");
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 lg:px-3 lg:py-2 text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-pink-500 hover:to-rose-500 rounded-xl transition-all duration-300 border-2 border-gray-300/60 hover:border-transparent font-medium text-xs lg:text-sm shadow-md hover:shadow-lg"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Search by title...</label>
                <input
                  type="text"
                  placeholder="Search by title..."
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Types</option>
                  <option value="system">System</option>
                  <option value="order">Order</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* LEFT: Notification List */}
        <div className="lg:w-1/3 backdrop-blur-xl rounded-xl border overflow-hidden flex flex-col" style={{ borderColor: '#A86523', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(251, 191, 36, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }}>
          <div className="backdrop-blur-sm border-b px-4 lg:px-6 py-3 lg:py-4 flex justify-between items-center" style={{ borderColor: '#A86523' }}>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FiBell className="text-indigo-600" /> Sent Notifications
            </h2>
          </div>

        <ul className="divide-y divide-gray-100 flex-1 overflow-y-auto">
          {loadingList ? (
            <li className="p-6 text-center text-gray-500">Loading...</li>
          ) : currentItems.length === 0 ? (
            <li className="p-6 text-center text-gray-500">No notifications found.</li>
          ) : (
            currentItems.map((n) => (
              <li
                key={n._id}
                className="flex items-start justify-between px-4 lg:px-6 py-3 lg:py-4 hover:bg-gradient-to-r hover:from-yellow-50/50 hover:via-amber-50/50 hover:to-orange-50/50 transition-all duration-300 border-b-2 border-gray-200/40"
              >
                {/* Left side */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-semibold">
                    {n.title?.charAt(0)?.toUpperCase() || "N"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{n.title}</h3>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                        {n.type || "system"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-1">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      To:{" "}
                      {n.userId
                        ? n.userId.fullName || n.userId.username || n.userId.email || "Unknown"
                        : "All Users"}
                    </p>
                  </div>
                </div>

                {/* Right side (time + delete) */}
                <div className="flex flex-col items-end text-right gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    onClick={() => handleDeleteNotification(n._id)}
                    className="p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
                    title="Delete notification"
                  >
                    <FiTrash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="backdrop-blur-sm border-t px-4 py-3 flex justify-between items-center text-sm text-gray-600" style={{ borderColor: '#A86523' }}>
              <span className="text-xs lg:text-sm">
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-300 transition-all duration-200"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-300 transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Templates Section */}
        <div className="lg:w-2/3 backdrop-blur-xl rounded-xl border overflow-hidden" style={{ borderColor: '#A86523', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(251, 191, 36, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }}>
          <div className="backdrop-blur-sm border-b px-4 lg:px-6 py-3 lg:py-4" style={{ borderColor: '#A86523' }}>
            <h2 className="text-lg lg:text-xl font-semibold flex items-center gap-2 text-gray-800">
              <FiFileText className="text-indigo-600" /> Notification Templates
            </h2>
          </div>
          <div className="p-4 lg:p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="backdrop-blur-sm border-b" style={{ borderColor: '#A86523' }}>
                  <tr>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Name</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Title</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="px-2 lg:px-4 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        No templates found.
                      </td>
                    </tr>
                  ) : (
                    templates.map((t) => (
                      <tr key={t._id} className="border-b-2 border-gray-200/40 hover:bg-gradient-to-r hover:from-yellow-50/50 hover:via-amber-50/50 hover:to-orange-50/50 transition-all duration-300">
                        <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900">{t.name || "(unnamed)"}</td>
                        <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm text-gray-900">{t.title}</td>
                        <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm capitalize text-gray-900">{t.type}</td>
                        <td className="px-2 lg:px-4 py-3">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => applyTemplateToForm(t)}
                              className="p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 border-yellow-400/60 bg-gradient-to-br from-yellow-100/80 via-amber-100/80 to-orange-100/80 hover:from-yellow-200 hover:via-amber-200 hover:to-orange-200 text-amber-700 hover:text-amber-800 backdrop-blur-sm"
                              title="Use this template"
                            >
                              <FiSend className="w-3 h-3 lg:w-4 lg:h-4" />
                            </button>
                            <button
                              onClick={() => handleEditTemplate(t)}
                              className="p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 border-yellow-400/60 bg-gradient-to-br from-yellow-100/80 via-amber-100/80 to-orange-100/80 hover:from-yellow-200 hover:via-amber-200 hover:to-orange-200 text-amber-700 hover:text-amber-800 backdrop-blur-sm"
                              title="Edit template"
                            >
                              <FiEdit2 className="w-3 h-3 lg:w-4 lg:h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t._id)}
                              className="p-1.5 rounded-xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-110 text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
                              title="Delete template"
                            >
                              <FiTrash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* === Modals === */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <button
                onClick={() => setShowCreate(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>

              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FiSend /> Create Notification
              </h2>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                  value={newNotification.title}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, title: e.target.value })
                  }
                />
                <textarea
                  placeholder="Message"
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60 min-h-[120px]"
                  value={newNotification.message}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, message: e.target.value })
                  }
                />
                <select
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                  value={newNotification.recipient}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, recipient: e.target.value })
                  }
                >
                  
                  <option value="specific">Specific Users (choose)</option>
                </select>

                {(newNotification.recipient === "single" ||
                  newNotification.recipient === "multiple") && (
                  <input
                    type="text"
                    placeholder={
                      newNotification.recipient === "single"
                        ? "Enter user ID"
                        : "Enter multiple IDs, separated by commas"
                    }
                    className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                    value={newNotification.userId}
                    onChange={(e) =>
                      setNewNotification({ ...newNotification, userId: e.target.value })
                    }
                  />
                )}

                {newNotification.recipient === "specific" && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openSelectUsersModal}
                      className="px-3 lg:px-4 py-2 lg:py-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 transition-all duration-200"
                    >
                      Select Users
                    </button>
                    <div className="text-sm text-gray-700">
                      {selectedUsers.length > 0 ? (
                        <span>{selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected</span>
                      ) : (
                        <span className="text-gray-400">No users selected</span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSendNotification}
                  disabled={sending}
                  className={`mt-2 bg-gradient-to-r from-[#E9A319] to-[#A86523] hover:from-[#A86523] hover:to-[#8B4E1A] text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 ${
                    sending ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {sending ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend /> Send Notification
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select Users Modal (popup B) */}
<AnimatePresence>
  {showSelectUsersModal && (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white p-4 lg:p-6 rounded-xl w-full max-w-2xl shadow-xl relative backdrop-blur-xl border"
        style={{ borderColor: '#A86523', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(251, 191, 36, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        <button
          onClick={closeSelectUsersModal}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FiX size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Select Users
        </h2>

        {/* Search input */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search users by name, username, or email..."
            className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />
        </div>

        {/* Select All checkbox */}
        {users.length > 0 && (
          <label className="flex items-center gap-2 mb-2 font-medium">
            <input
              type="checkbox"
              checked={
                users.length > 0 && selectedUsers.length === users.length
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUsers(users.map((u) => u._id));
                } else {
                  setSelectedUsers([]);
                }
              }}
              className="w-4 h-4"
            />
            <span>Select All</span>
          </label>
        )}

        {/* Filtered user list */}
        {(() => {
          const filteredUsers = users.filter(
            (u) =>
              u.fullName?.toLowerCase().includes(searchUser.toLowerCase()) ||
              u.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
              u.email?.toLowerCase().includes(searchUser.toLowerCase())
          );

          return (
            <div className="max-h-80 overflow-y-auto border rounded-lg p-2">
              {usersLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading accounts...
                </div>
              ) : usersError ? (
                <div className="p-4 text-center text-red-500">{usersError}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No users found.</div>
              ) : (
                <ul className="space-y-2">
                  {filteredUsers.map((u) => {
                    const displayName =
                      u.name || u.fullName || u.username || u.email || "Unknown";
                    return (
                      <li
                        key={u._id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u._id)}
                            onChange={() => toggleUserSelection(u._id)}
                            className="w-4 h-4"
                          />
                          <div className="text-sm">
                            <div className="font-medium">{u.username}</div>
                            <div className="text-xs text-gray-500">
                              {displayName !== u.username ? displayName : u.email}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })()}

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={closeSelectUsersModal}
            className="px-3 lg:px-4 py-2 lg:py-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-amber-50 hover:text-gray-800 hover:border-amber-300 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={confirmSelectUsers}
            className="px-3 lg:px-4 py-2 lg:py-3 text-sm font-medium text-white bg-gradient-to-r from-[#E9A319] to-[#A86523] hover:from-[#A86523] hover:to-[#8B4E1A] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Confirm ({selectedUsers.length})
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


      {/* === Create Template Modal === */}
      <AnimatePresence>
        {showCreateTemplate && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-4 lg:p-6 rounded-xl w-full max-w-lg shadow-xl relative backdrop-blur-xl border"
              style={{ borderColor: '#A86523', boxShadow: '0 25px 70px rgba(168, 101, 35, 0.3), 0 15px 40px rgba(251, 191, 36, 0.25), 0 5px 15px rgba(168, 101, 35, 0.2)' }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>

              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FiFileText /> Create Template
              </h2>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Template Name"
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                />
                <textarea
                  placeholder="Message"
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 border-2 border-gray-300/60 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 backdrop-blur-sm text-sm lg:text-base focus:border-amber-500 focus:ring-amber-500/30 shadow-md hover:shadow-lg hover:border-yellow-400/60 min-h-[120px]"
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                />
                <button
                  onClick={handleCreateTemplate}
                  disabled={savingTemplate}
                  className={`mt-2 bg-gradient-to-r from-[#E9A319] to-[#A86523] hover:from-[#A86523] hover:to-[#8B4E1A] text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 ${
                    savingTemplate ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {savingTemplate ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiPlus /> Save Template
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
