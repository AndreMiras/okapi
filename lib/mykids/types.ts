export type Course = {
  courseId?: string;
  courseName?: string;
  groupId?: string;
  groupName?: string;
  schoolId?: string;
  schoolName?: string;
  attendance?: number;
  absences?: number;
  languageText?: string;
};
export type Event = {
  category?: number;
  date?: string;
  dateTimeUTC?: string;
  place?: string;
  time?: string;
  title?: string;
};
export type Student = {
  studentId?: string;
  name?: string;
  url?: string;
  courseList?: Course[];
  eventsList?: Event[];
};
export type LoginPayload = {
  authToken: string;
  username?: string;
  dashboard?: Student[];
};
export type ReportFile = { name?: string; type?: string; url?: string };
export type Report = { title?: string; files?: ReportFile[] };
export type Absence = { date?: string; title?: string; reason?: string };
export type Absences = {
  absences?: Absence[];
  dates?: {
    dates?: { date?: string; followUpId?: string }[];
    concepts?: string[];
  };
};
export type School = {
  title?: string;
  address?: string[];
  email?: string;
  phone?: string[];
  latitude?: string;
  longitude?: string;
  web?: string;
};
export type Information = {
  title?: string;
  description?: string;
  urlPdf?: string;
};
