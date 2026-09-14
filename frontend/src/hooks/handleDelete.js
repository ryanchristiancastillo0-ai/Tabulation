export const handleDeleteAllData = async (API_BASE, helpers) => {
  const { setShowDeleteModal, setToast } = helpers;
  setShowDeleteModal(false);
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/reset-data`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      setToast(true);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const errorData = await response.json();
      alert("Reset failed: " + (errorData.error || "Unauthorized"));
    }
  } catch (err) {
    console.error("Delete failed:", err);
  }
};