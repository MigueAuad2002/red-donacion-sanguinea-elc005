from app.repos import audit_repos




def listar_bitacora():
    return audit_repos.obtener_bitacora()

