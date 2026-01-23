
export class CreateEmployeeDto {
  orgId: string;
  name: string;
  phone: string;
  role?: string;
  wageType?: string;
  wageAmount?: number;
  birthday?: string;
}
