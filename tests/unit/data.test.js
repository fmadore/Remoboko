import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  parseDate, normalizePublications, normalizeCollaborators, normalizeTimeline, outputSeries, aggregatePeriods,
  readableInk, contrastRatio, genderSeries,
} from '../../assets/data.js';

const palette = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7'];
const load = async (name) => JSON.parse(await readFile(new URL(`../../${name}`, import.meta.url), 'utf8'));

test('strict UTC date parsing rejects rollover and incomplete dates', () => {
  assert.equal(parseDate('2023-02-29'), null);
  assert.equal(parseDate('2024-13-01'), null);
  assert.equal(parseDate('2024'), null);
  assert.equal(parseDate('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
});

test('publication normalization reports invalid rows and keeps unknown languages', () => {
  const { records, issues } = normalizePublications({ rows: [
    { Type: ' Book ', Date: '2024-03-31' },
    { Type: 'Book', Language: 'French', Date: '2024-04-01' },
    { Type: 'Book', Date: '2024-02-30' }, { Date: '2024-01-01' },
  ] });
  assert.deepEqual(records.map((r) => [r.type, r.language, r.quarter]), [['Book', 'Unknown', '2024-Q1'], ['Book', 'French', '2024-Q2']]);
  assert.equal(issues.length, 2);
  assert.throws(() => normalizePublications([]), /rows array/);
});

test('published output totals survive folding and both time granularities', async () => {
  const { records, issues } = normalizePublications(await load('Final report/Data/Publications_and_activities_data.json'));
  assert.equal(records.length, 181);
  assert.equal(issues.length, 0);
  const series = outputSeries(records, palette, '#9c9c98');
  assert.equal(series.length, 8);
  assert.equal(series.reduce((n, s) => n + s.count, 0), 181);
  for (const [granularity, length] of [['quarter', 29], ['year', 8]]) {
    const rows = aggregatePeriods(records, series, granularity);
    assert.equal(rows.length, length);
    assert.equal(rows.reduce((sum, row) => sum + Object.values(row.counts).reduce((a, b) => a + b, 0), 0), 181);
  }
});

test('empty periods are retained and a real Other type does not collide with folded types', () => {
  const { records } = normalizePublications({ rows: [
    { Type: 'Other', Date: '2023-10-01' }, { Type: 'Other', Date: '2024-04-01' },
    { Type: 'Report', Date: '2024-04-02' },
  ] });
  const series = outputSeries(records, palette, '#9c9c98', 1);
  assert.deepEqual(series.map((s) => s.id), ['type:Other', 'other']);
  const rows = aggregatePeriods(records, series, 'quarter');
  assert.deepEqual(rows.map((r) => r.period), ['2023-Q4', '2024-Q1', '2024-Q2']);
  assert.deepEqual(rows[1].counts, { 'type:Other': 0, other: 0 });
  assert.deepEqual(series[1].typeCounts, [['Report', 1]]);
  assert.deepEqual(aggregatePeriods([], [], 'year'), []);
});

test('collaborator categories normalize whitespace, case and missing values', () => {
  const rows = normalizeCollaborators([
    { Collaborator: ' Alice ', Gender: ' FEMALE ', Country: ' Benin ' },
    { Collaborator: 'Bob', Gender: null, Country: '' },
  ]);
  assert.deepEqual(rows.map((r) => [r.Collaborator, r.Gender, r.Country]), [['Alice', 'female', 'Benin'], ['Bob', 'unknown', 'Unknown']]);
});

test('gender series keeps missing gender in the denominator, like the Python print figure', async () => {
  const colors = { female: palette[0], male: palette[1], other: '#9c9c98' };
  const series = genderSeries([{ Gender: 'male' }, { Gender: null }, { Gender: ' Female ' }, { Gender: '' }, {}], colors);
  assert.deepEqual(series.map((s) => [s.id, s.label, s.count, s.color]), [
    ['female', 'Women', 1, palette[0]], ['male', 'Men', 1, palette[1]], ['unknown', 'Unknown', 3, '#9c9c98'],
  ]);
  assert.equal(series.reduce((sum, s) => sum + s.share, 0), 1);
  assert.deepEqual(genderSeries([], colors), []);
  assert.equal(genderSeries([{ Gender: 'male' }], colors)[0].color, palette[1]);
  const published = genderSeries(normalizeCollaborators(await load('Final report/Data/Collaborators_data.json')), colors);
  assert.deepEqual(published.map((s) => [s.id, s.count]), [['female', 35], ['male', 58]]);
});

test('published collaborator and timeline data normalize without losing records', async () => {
  assert.equal(normalizeCollaborators(await load('Final report/Data/Collaborators_data.json')).length, 93);
  const events = normalizeTimeline(await load('Book_DeGruyter/Timeline/data.json'));
  assert.equal(events.length, 37);
  assert.equal(events.filter((e) => e.category === 'Religion').length, 14);
  assert.throws(() => normalizeTimeline([{ date: '2024-02-30' }]), /Timeline event/);
});

test('treemap label ink passes normal-text contrast on every palette color and tint', () => {
  for (const color of [...palette, '#9c9c98', '#ffffff', '#abcdef', '#808080']) {
    assert.ok(contrastRatio(color, readableInk(color)) >= 4.5, color);
  }
});
