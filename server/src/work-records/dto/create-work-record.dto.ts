
export class CreateWorkRecordDto {
  projectId: string;
  memberId: string;
  date: string;
  duration: number;
  content?: string;
}
