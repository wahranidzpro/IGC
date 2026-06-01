import type {
  Profile, ProfileInsert, ProfileUpdate,
  Club, ClubInsert, ClubUpdate,
  Member, MemberInsert, MemberUpdate,
  Membership, MembershipInsert, MembershipUpdate,
  Payment, PaymentInsert, PaymentUpdate,
  Attendance, AttendanceInsert, AttendanceUpdate,
  Device, DeviceInsert, DeviceUpdate,
  QrToken, QrTokenInsert, QrTokenUpdate,
  RfidCard, RfidCardInsert, RfidCardUpdate,
  Coach, CoachInsert, CoachUpdate,
  Notification, NotificationInsert, NotificationUpdate,
  MemberCoach, MemberCoachInsert, MemberCoachUpdate,
  WorkoutProgram, WorkoutProgramInsert, WorkoutProgramUpdate,
  NutritionProgram, NutritionProgramInsert, NutritionProgramUpdate,
  ProgressLog, ProgressLogInsert, ProgressLogUpdate,
  Message, MessageInsert, MessageUpdate,
  Schedule, ScheduleInsert, ScheduleUpdate,
  UserRole, MemberStatus, MembershipType, MembershipStatus,
  PaymentMethod, PaymentStatus, PaymentCategory,
  DeviceType, DeviceDirection,
  AttendanceType, AttendanceMethod,
  DashboardStats,
} from "@/types"

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ProfileInsert; Update: ProfileUpdate }
      clubs: { Row: Club; Insert: ClubInsert; Update: ClubUpdate }
      members: { Row: Member; Insert: MemberInsert; Update: MemberUpdate }
      coaches: { Row: Coach; Insert: CoachInsert; Update: CoachUpdate }
      memberships: { Row: Membership; Insert: MembershipInsert; Update: MembershipUpdate }
      payments: { Row: Payment; Insert: PaymentInsert; Update: PaymentUpdate }
      attendance: { Row: Attendance; Insert: AttendanceInsert; Update: AttendanceUpdate }
      devices: { Row: Device; Insert: DeviceInsert; Update: DeviceUpdate }
      qr_tokens: { Row: QrToken; Insert: QrTokenInsert; Update: QrTokenUpdate }
      rfid_cards: { Row: RfidCard; Insert: RfidCardInsert; Update: RfidCardUpdate }
      notifications: { Row: Notification; Insert: NotificationInsert; Update: NotificationUpdate }
      member_coaches: { Row: MemberCoach; Insert: MemberCoachInsert; Update: MemberCoachUpdate }
      workout_programs: { Row: WorkoutProgram; Insert: WorkoutProgramInsert; Update: WorkoutProgramUpdate }
      nutrition_programs: { Row: NutritionProgram; Insert: NutritionProgramInsert; Update: NutritionProgramUpdate }
      progress_logs: { Row: ProgressLog; Insert: ProgressLogInsert; Update: ProgressLogUpdate }
      messages: { Row: Message; Insert: MessageInsert; Update: MessageUpdate }
      schedules: { Row: Schedule; Insert: ScheduleInsert; Update: ScheduleUpdate }
    }
    Views: Record<string, never>
    Functions: {
      get_dashboard_stats: {
        Args: { p_club_id?: string }
        Returns: DashboardStats
      }
      check_member_access: {
        Args: { p_member_id: string }
        Returns: boolean
      }
      record_attendance: {
        Args: { p_member_id: string; p_device_id?: string; p_method: AttendanceMethod }
        Returns: Attendance
      }
    }
    Enums: {
      user_role: UserRole
      member_status: MemberStatus
      membership_type: MembershipType
      membership_status: MembershipStatus
      payment_method: PaymentMethod
      payment_status: PaymentStatus
      device_type: DeviceType
      attendance_type: AttendanceType
      attendance_method: AttendanceMethod
    }
  }
}
