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
    recipient: "all",
    userId: "",
  });

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    title: "",
    message: "",
  });

  const [editingTemplate, setEditingTemplate] = useState(null);

  // ===== FETCH =====
  useEffect(() => {
    fetchNotifications();
    fetchTemplates();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingList(true);
      const res = await axios.get("http://localhost:5000/notifications/admin/all");
      // backend trả mảng notifications
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
        payload.userId = newNotification.userId.trim();
      } else if (newNotification.recipient === "multiple") {
        payload.recipientType = "multiple";
        payload.userIds = newNotification.userId
          .split(",")
          .map((u) => u.trim())
          .filter((u) => u);
      }

      await axios.post("http://localhost:5000/notifications/admin/create", payload);
      alert("✅ Notification sent successfully!");
      setShowCreate(false);
      setNewNotification({ title: "", message: "", recipient: "all", userId: "" });
      fetchNotifications();
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
  // Dùng template để mở form tạo notification
  const applyTemplateToForm = (template) => {
    setTab("notifications");
    // chờ render tab rồi mở modal để tránh mất focus
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

  // CREATE TEMPLATE
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
    // nếu page hiện tại vượt totalPages thì reset về cuối
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===== UI =====
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header box giống voucher */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiBell className="text-indigo-600" /> Sent Notifications
            </h1>
            <p className="text-gray-500 text-sm">View and manage all sent notifications.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
  onClick={() => setShowFilter(!showFilter)}
  className="bg-[#4f46e5] text-white px-4 py-2 rounded-lg shadow hover:bg-[#4338ca] flex items-center gap-2 text-sm"
>
  <FiFilter /> Show Filters
</button>


            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 flex items-center gap-2 text-sm"
            >
              <FiPlus /> Create Notification
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg"
            >
              <div className="flex flex-col md:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by title..."
                  className="border rounded-lg px-3 py-2 w-full md:w-1/3"
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <select
                  className="border rounded-lg px-3 py-2 w-full md:w-1/4"
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
                <button
                  onClick={() => {
                    setFilterType("");
                    setSearchKeyword("");
                    setCurrentPage(1);
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table container */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-700">
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Recipient</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingList ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No notifications found.
                </td>
              </tr>
            ) : (
              currentItems.map((n) => (
                <tr key={n._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{n.title}</td>
                  <td className="px-4 py-3">
                    {n.userId
                      ? n.userId.fullName || n.userId.username || n.userId.email || "Unknown User"
                      : "All Users"}
                  </td>
                  <td className="px-4 py-3 capitalize">{n.type || "system"}</td>
                  <td className="px-4 py-3">{new Date(n.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteNotification(n._id)}
                      className="p-2 rounded-md text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

       {/* Pagination */}
{totalPages > 1 && (
  <div className="flex justify-between items-center p-4 border-t bg-gray-50 text-sm">
    <span className="text-gray-700">
     Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} notifications

    </span>

    <div className="flex items-center space-x-1">
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md text-sm ${
          currentPage === 1
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          className={`px-3 py-1 rounded-md text-sm border ${
            currentPage === i + 1
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-md text-sm ${
          currentPage === totalPages
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        Next
      </button>
    </div>
  </div>
)}

      </div>

      {/* Templates tab (kept but accessible via button in UI) */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiFileText className="text-indigo-600" /> Notification Templates
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
            >
              <FiPlus /> Create Template
            </button>
            
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
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
                  <tr key={t._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{t.name || "(unnamed)"}</td>
                    <td className="px-4 py-3">{t.title}</td>
                    <td className="px-4 py-3 capitalize">{t.type}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => applyTemplateToForm(t)}
                        className="p-2 rounded-md text-green-600 hover:bg-green-50"
                        title="Use this template"
                      >
                        <FiSend />
                      </button>
                      <button
                        onClick={() => handleEditTemplate(t)}
                        className="p-2 rounded-md text-indigo-600 hover:bg-indigo-50"
                        title="Edit template"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t._id)}
                        className="p-2 rounded-md text-red-600 hover:bg-red-50"
                        title="Delete template"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === Create Notification Modal === */}
      <AnimatePresence>
        {showCreate && (
          <Modal title="Create Notification" onClose={() => setShowCreate(false)}>
            <div className="space-y-3">
              <input
                className="border rounded-lg w-full px-3 py-2"
                placeholder="Title"
                value={newNotification.title}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, title: e.target.value })
                }
              />
              <textarea
                className="border rounded-lg w-full px-3 py-2"
                placeholder="Message"
                rows="4"
                value={newNotification.message}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, message: e.target.value })
                }
              />
              <select
                className="border rounded-lg w-full px-3 py-2"
                value={newNotification.recipient}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, recipient: e.target.value })
                }
              >
                <option value="all">All users</option>
                <option value="single">Specific user</option>
                <option value="multiple">Selected users</option>
              </select>

              {newNotification.recipient !== "all" && (
                <input
                  className="border rounded-lg w-full px-3 py-2"
                  placeholder={
                    newNotification.recipient === "multiple"
                      ? "Enter user IDs separated by commas"
                      : "Enter user ID"
                  }
                  value={newNotification.userId}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, userId: e.target.value })
                  }
                />
              )}

              <button
                onClick={handleSendNotification}
                disabled={sending}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full flex items-center justify-center gap-2"
              >
                <FiSend />
                {sending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* === Create Template Modal === */}
      <AnimatePresence>
        {showCreateTemplate && (
          <Modal
            title="Create New Template"
            onClose={() => setShowCreateTemplate(false)}
          >
            <div className="space-y-3">
              <input
                className="border rounded-lg w-full px-3 py-2"
                placeholder="Template Name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
              <input
                className="border rounded-lg w-full px-3 py-2"
                placeholder="Title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
              />
              <textarea
                className="border rounded-lg w-full px-3 py-2"
                placeholder="Message"
                rows="4"
                value={newTemplate.message}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, message: e.target.value })
                }
              />
              <button
                onClick={handleCreateTemplate}
                disabled={savingTemplate}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium ${
                  savingTemplate ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {savingTemplate ? "Saving..." : "Save Template"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* === Edit Template Modal === */}
      <AnimatePresence>
        {showEditTemplate && editingTemplate && (
          <Modal title="Edit Notification Template" onClose={() => setShowEditTemplate(false)}>
            <div className="space-y-3">
              <input
                className="border rounded-lg w-full px-3 py-2"
                value={editingTemplate.title}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, title: e.target.value })
                }
              />
              <textarea
                className="border rounded-lg w-full px-3 py-2"
                rows="4"
                value={editingTemplate.message}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, message: e.target.value })
                }
              />
              <button
                onClick={handleSaveTemplate}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full"
              >
                Save Changes
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// === Reusable Modal ===
function Modal({ title, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        exit={{ y: -20 }}
        className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            <FiX />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
