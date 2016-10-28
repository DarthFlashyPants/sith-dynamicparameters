DROP FUNCTION public.notify_trigger();
CREATE FUNCTION notify_trigger() RETURNS trigger AS $$
DECLARE
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- If Trigger operation = INSERT, Notify w/ Table Name , the action (Insert), and the "new" value of the name column.
    PERFORM pg_notify('watchers', TG_TABLE_NAME || ',INSERT,' || NEW.name );
    RETURN new;
  ELSEIF (TG_OP= 'DELETE') THEN
    PERFORM pg_notify('watchers', TG_TABLE_NAME || ',DELETE,' || OLD.name );
    RETURN old;
  ELSEIF (TG_OP= 'UPDATE') THEN
    -- If TG_OP, then we need to pass the original AND new value for the name column.
    PERFORM pg_notify('watchers', TG_TABLE_NAME || ',UPDATE,' || OLD.name || ',' || NEW.name );
    RETURN new;
  END IF;
END;
$$ LANGUAGE plpgsql;

---------------------------End FUNCTION ----------------------------

--  Create trigger to "camp" the category table so we can keep an eye on the 'name' column
DROP TRIGGER watched_table_trigger ON public.category;
CREATE TRIGGER watched_table_trigger AFTER UPDATE OR INSERT OR DELETE ON category
FOR EACH ROW EXECUTE PROCEDURE notify_trigger();


----- End trigger -------------
