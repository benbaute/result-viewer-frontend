import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FeatureCollection, Point, LineString } from 'geojson';

@Injectable({
  providedIn: 'root'
})
export class RideRequestService {
  private readonly _http = inject(HttpClient);

  
  public getIds(): Observable<number[]> {
    console.log("Api call: /api/ride/ids")
    return this._http.get<number[]>('/api/ride/ids');
  }

  public getRidePoints(id: number): Observable<FeatureCollection<Point>> {
    return this._http.get<FeatureCollection<Point>>(`/api/ride/${id}/points`);
  }

  public getMatchedPoints(id: number): Observable<FeatureCollection<Point>> {
    return this._http.get<FeatureCollection<Point>>(`/api/ride/${id}/matched_points`);
  }

  public getEdges(id: number): Observable<FeatureCollection<LineString>> {
    return this._http.get<FeatureCollection<LineString>>(`/api/ride/${id}/edges`);
  }

  public getIntersectionDelays(id: number): Observable<FeatureCollection<LineString>> {
    return this._http.get<FeatureCollection<LineString>>(`/api/ride/${id}/intersection_delays`);
  }

  public getIntersectionDelaysGroup(): Observable<FeatureCollection<LineString>> {
    return this._http.get<FeatureCollection<LineString>>(`/api/ride/intersection_delays`);
  }

  public getAvgSpeeds(): Observable<FeatureCollection<LineString>> {
    return this._http.get<FeatureCollection<LineString>>(`/api/ride/edge-speeds`);
  }

  public getRideIdsByOsmId(osmId: number): Observable<number[]> {
    return this._http.get<number[]>(`/api/ride/rideIds/${osmId}`);
  }

  public getTrafficSignals(): Observable<FeatureCollection<Point>> {
    return this._http.get<FeatureCollection<Point>>(`/api/osm/traffic-signals`);
  }

  public getTrafficSignalsByOsmId(osmId: number): Observable<FeatureCollection<Point>> {
    return this._http.get<FeatureCollection<Point>>(`/api/osm/traffic-signals/${osmId}`);
  }

  public getTrafficSignalClusters(): Observable<FeatureCollection<Point>> {
    return this._http.get<FeatureCollection<Point>>(`/api/osm/cluster`);
  }
}