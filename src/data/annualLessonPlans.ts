import { LessonPlanItem } from '../types';
import { ANNUAL_PLANS_PP_TO_2 } from './annualPlansPrePrimaryTo2';
import { ANNUAL_PLANS_CLASS_3 } from './annualPlansClass3';
import { ANNUAL_PLANS_CLASS_4 } from './annualPlansClass4';
import { ANNUAL_PLANS_CLASS_5 } from './annualPlansClass5';
import { ANNUAL_PLANS_ENRICHED } from './annualPlansEnriched';

export const ANNUAL_LESSON_PLANS: LessonPlanItem[] = [
  ...ANNUAL_PLANS_PP_TO_2,
  ...ANNUAL_PLANS_CLASS_3,
  ...ANNUAL_PLANS_CLASS_4,
  ...ANNUAL_PLANS_CLASS_5,
  ...ANNUAL_PLANS_ENRICHED,
];
