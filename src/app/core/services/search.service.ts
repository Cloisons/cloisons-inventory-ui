import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, debounceTime } from 'rxjs';

export interface SearchState {
  query: string;
  currentPage: string;
  isSearching: boolean;
  lastSearchTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService implements OnDestroy {
  private readonly SEARCH_DEBOUNCE_TIME = 300; // milliseconds
  private readonly MAX_QUERY_LENGTH = 100;
  
  private searchQuerySubject = new BehaviorSubject<string>('');
  public searchQuery$ = this.searchQuerySubject.asObservable();

  private currentPageSubject = new BehaviorSubject<string>('');
  public currentPage$ = this.currentPageSubject.asObservable();

  private clearSearchSubject = new BehaviorSubject<boolean>(false);
  public clearSearch$ = this.clearSearchSubject.asObservable();

  private searchStateSubject = new BehaviorSubject<SearchState>({
    query: '',
    currentPage: '',
    isSearching: false,
    lastSearchTime: 0
  });
  public searchState$ = this.searchStateSubject.asObservable();

  // Debounced search query for better performance
  public debouncedSearchQuery$ = this.searchQuery$.pipe(
    debounceTime(this.SEARCH_DEBOUNCE_TIME),
    distinctUntilChanged()
  );

  constructor() {}

  setSearchQuery(query: string): void {
    // Validate and sanitize the query
    const sanitizedQuery = this.sanitizeQuery(query);
    
    if (sanitizedQuery !== this.searchQuerySubject.value) {
      this.searchQuerySubject.next(sanitizedQuery);
      this.updateSearchState({ 
        query: sanitizedQuery, 
        isSearching: sanitizedQuery.length > 0,
        lastSearchTime: Date.now()
      });
    }
  }

  getCurrentSearchQuery(): string {
    return this.searchQuerySubject.value;
  }

  setCurrentPage(page: string): void {
    if (page !== this.currentPageSubject.value) {
      this.currentPageSubject.next(page);
      this.updateSearchState({ currentPage: page });
    }
  }

  getCurrentPage(): string {
    return this.currentPageSubject.value;
  }

  clearSearch(): void {
    this.searchQuerySubject.next('');
    this.clearSearchSubject.next(true);
    this.updateSearchState({ 
      query: '', 
      isSearching: false,
      lastSearchTime: 0
    });
    
    // Reset the clear search subject immediately after emitting
    setTimeout(() => this.clearSearchSubject.next(false), 0);
  }

  getSearchState(): SearchState {
    return this.searchStateSubject.value;
  }

  isSearchActive(): boolean {
    const state = this.getSearchState();
    return state.query.length > 0 && state.isSearching;
  }

  hasRecentSearch(): boolean {
    const state = this.getSearchState();
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    return state.lastSearchTime > fiveMinutesAgo;
  }

  // Private methods
  private sanitizeQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Trim whitespace and limit length
    const trimmed = query.trim();
    return trimmed.length > this.MAX_QUERY_LENGTH 
      ? trimmed.substring(0, this.MAX_QUERY_LENGTH)
      : trimmed;
  }

  private updateSearchState(updates: Partial<SearchState>): void {
    const currentState = this.searchStateSubject.value;
    const newState = { ...currentState, ...updates };
    this.searchStateSubject.next(newState);
  }

  ngOnDestroy(): void {
    // Clean up subjects
    this.searchQuerySubject.complete();
    this.currentPageSubject.complete();
    this.clearSearchSubject.complete();
    this.searchStateSubject.complete();
  }
}
