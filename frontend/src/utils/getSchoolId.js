export function getSchoolId() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('school_id')) return params.get('school_id');
    const direct = localStorage.getItem('school_id');
    if (direct) return direct;
    const judgeSchool = localStorage.getItem('judgeSchool');
    if (judgeSchool) return JSON.parse(judgeSchool)?.id || 1;
    const user = localStorage.getItem('adminUser');
    if (user) return JSON.parse(user)?.school_id || 1;
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth)?.admin?.school_id || JSON.parse(auth)?.school?.id || 1;
    return 1;
  } catch {
    return 1;
  }
}