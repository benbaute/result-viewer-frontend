import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RideRequestService } from '../domain/ride-request.service';
import { FeatureCollection, Point, LineString } from 'geojson';

@Injectable({
  providedIn: 'root'
})
export class RideFacade {
  private readonly _rideRequestService = inject(RideRequestService);

  public getIds(): Observable<number[]> {
    return this._rideRequestService.getIds();
  }

  public getRidePoints(id: number): Observable<FeatureCollection<Point>> {
    return this._rideRequestService.getRidePoints(id);
  }

  public getMatchedPoints(id: number): Observable<FeatureCollection<Point>> {
    return this._rideRequestService.getMatchedPoints(id);
  }

  public getEdges(id: number): Observable<FeatureCollection<LineString>> {
    return this._rideRequestService.getEdges(id);
  }

  public getIntersectionDelays(id: number): Observable<FeatureCollection<LineString>> {
    return this._rideRequestService.getIntersectionDelays(id);
  }

  public getIntersectionDelaysGroup(): Observable<FeatureCollection<LineString>> {
    return this._rideRequestService.getIntersectionDelaysGroup();
  }


  public getAvgSpeeds(): Observable<FeatureCollection<LineString>> {
    return this._rideRequestService.getAvgSpeeds();
  }

  public getRideIdsByOsmId(osmId: number): Observable<number[]> {
    return this._rideRequestService.getRideIdsByOsmId(osmId);
  }

  public getTrafficSignals(): Observable<FeatureCollection<Point>> {
    return this._rideRequestService.getTrafficSignals();
  }

  public getTrafficSignalsByOsmId(osmId: number): Observable<FeatureCollection<Point>> {
    return this._rideRequestService.getTrafficSignalsByOsmId(osmId);
  }

  public getTrafficSignalClusters(): Observable<FeatureCollection<Point>> {
    return this._rideRequestService.getTrafficSignalClusters();
  }
}
