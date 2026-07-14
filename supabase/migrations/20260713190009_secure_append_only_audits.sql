revoke update,delete,truncate on app.result_revisions from service_role;
revoke update,delete,truncate on private.destructive_audit_events from service_role;
revoke insert,update,delete,truncate on app.admin_access_events from service_role;
